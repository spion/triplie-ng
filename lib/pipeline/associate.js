var async = require('async'),
    cluster = require('../util').cluster,
    unique = require('../util').unique,
    product = require('../util').product,
    subtract = require('../util').subtract;
    decay = require('../util').decay;
    confidence = require('../util').confidence;
    lookup = require('../util').lookup;

module.exports = function(db, opt, compare) {

    function clustercount(cl) { 
        return cl.reduce(function(acc, w) { 
            return acc + w.count
        }, 0);
    }

    function clustervalue(cl) {
        return cl.reduce(function(acc, w) {
            return Math.max(acc, w.value || 1);
        }, 0);
    }

    var generalization = opt.generalization / 100;

    function pairing_formula(cooccurrences, leftcount, rightcount) {
        //return cooccurrences / 
            //(generalization * leftcount + 
            //(1 - generalization) * rightcount - cooccurrences)

        var maxcount = db.dict.get(0).count;
        var pleft = leftcount / maxcount, 
            pright = rightcount / maxcount, 
            pboth = cooccurrences / maxcount;
        
        return confidence(cooccurrences, leftcount+rightcount);
        
        // Alternative formula
        return pboth / 
            (Math.pow(pright, 2 * generalization) 
             * Math.pow(pleft, 2 - 2 * generalization));

    }

    function extractId(word) { return word.id; }

    var self = function associate(similars, done) {
        hlog('associate', 'start');

        var now = Date.now();
        var simclusters = cluster(similars, compare.similar), aclusters;


        var original = lookup(similars, extractId);

            
        db.assoc.find(similars.map(extractId), afterAssociations);
        function afterAssociations(err, assocs) {
            hlog('afterAssociate', 'start');
            if (err) console.log(err);
            assocs = assocs.sort(function(a1, a2) {
                var o1val = original[a1.oid].value || 1;
                var o2val = original[a2.oid].value || 1;

                var vv = a2.count * decay(a1.modified, now, 
                                        opt.associations.halflife) * o2val
                       - a1.count * decay(a2.modified, now, 
                                        opt.associations.halflife) * o1val;
            
            }).slice(0, opt.associations.limit);

            hlog('afterAssociate', 'sort-end');

            var assocwords = unique(compare.expand(assocs
                .map(function(a) { return db.dict.get(a.id); }))
                .sort(function(w1, w2) { return w1.id - w2.id; }));
                
            aclusters = cluster(assocwords, compare.similar);


            var clusterPairQueries = product(simclusters, aclusters, 
                function(simcluster, acluster, simid, aid) {
                    return function(cb) {
                        db.assoc.cooccurrences(
                            simcluster.map(extractId), 
                            acluster.map(extractId), 
                            function acomp(err, res) {
                                if (err) return cb(err);
                                //hlog('clusterPairQueries', 'end')
                                cb(null, {
                                    simid:simid, aid: aid, 
                                    cooccurrences: res.cooccurrences || 0,
                                    modified: res.modified 
                                });
                        }); 
                    };
                });
            hlog('afterAssociate', 'compare-expand-cluster end');
            async.parallel(clusterPairQueries, afterClusterPairQueries);
        }

        function afterClusterPairQueries(err, pairs) {
            console.log("got", pairs.length, "association pairs");
            hlog('afterAssociate', 'end');
            hlog('afterClusterPairQueries', 'start');
            var simcounts = simclusters.map(clustercount),
                acounts   = aclusters.map(clustercount);
            var avalues = {};
            pairs.forEach(function(pair) {
                if (!pair.cooccurrences) return;
                if (!avalues[pair.aid]) avalues[pair.aid] = 0;

                var origval = original[pair.simid] ? original[pair.simid].value
                            : original[pair.aid] ? original[pair.aid].value
                            : 1;

                var decayedCooccurrences = pair.cooccurrences 
                    * decay(pair.modified, now, opt.associations.halflife)
                    * origval
                
                avalues[pair.aid] += pairing_formula(decayedCooccurrences, 
                                                     simcounts[pair.simid],
                                                     acounts[pair.aid]);
            });
            var clusters = aclusters.map(function(items, i) {
                return { items: items.map(extractId), value: avalues[i] }
            }).sort(function(c1, c2) {
                return c2.value - c1.value;
            }).filter(function(c) { 
                return c.items.length > 0; 
            }).slice(0, opt.keywords.limit);

            hlog('afterClusterPairQueries', 'end');
            //console.log("answering", clusters.map(function(c) { 
              //return {items: db.dict.wordify(c.items), value: c.value}; }));
            return done(null, clusters);        
        } 

    };

    self.pick = function(sims, answers, done) {
        hlog('associate.pick', 'start');

        if (!answers.length) 
            return done(null, []);
        var now = Date.now()
        var simscc = clustercount(sims);


        var original = lookup(sims, extractId);

        var queries = answers.map(function(ans) {
            var ansForEval = subtract(ans, sims.map(extractId));
            var anscc = clustercount(ans.map(function(id) { 
                return db.dict.get(id);
            }));
            return function(cb) {
                db.assoc.cooccurrences(sims.map(extractId), 
                                       ansForEval, 
                                       function acomp(err, res) {
                    if (err) return cb(err);

                    var oval = original[res.oid] ? original[res.oid].value
                             : original[res.id] ? original[res.id].value
                             : 1;

                    var age = (now - res.modified) 
                              / 1000 / 3600 / 24,
                        decayed = decay(res.modified, now, 
                                        opt.associations.halflife);
                    var decayedCooccurrences = res.cooccurrences * decayed
                                               * oval;
                    var val = pairing_formula(decayedCooccurrences, 
                                              simscc, anscc);
                    val = val * 1000000000;
                    console.log(val.toFixed(2), db.dict.wordify(ans).join(' '));
                    cb(null, {answer: ans, val: val }); 
                });
            };
        });
        async.parallel(queries, function(err, results) {
            var best = results.sort(function(r1, r2) { 
                return r2.val - r1.val 
            }).shift();
            hlog('associate.pick', 'end');
            done(null, best.answer);
        });
    }
    return self;
}
