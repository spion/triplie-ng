var async = require('async'),
    cluster = require('../util').cluster,
    unique = require('../util').unique,
    product = require('../util').product,
    subtract = require('../util').subtract;
    decay = require('../util').decay;

module.exports = function(db, opt, compare) {

    function clustercount(cl) { 
        return cl.reduce(function(acc, id) { 
            return acc + db.dict.get(id).count
        })
    }
    var generalization = opt.generalization / 100;

    function pairing_formula(cooccurrences, leftcount, rightcount) {
        return cooccurrences / 
            (generalization * leftcount + (1 - generalization) * rightcount)

        return cooccurrences * Math.log(
            cooccurrences / (leftcount * rightcount));
    }


    var self = function associate(similarids, done) {

        var now = Date.now();
        var simclusters = cluster(similarids, compare.similar), aclusters;               


        db.assoc.find(similarids, afterAssociations);

        function afterAssociations(err, assocs) {
            if (err) console.log(err);
            assocs = assocs.sort(function(a1, a2) {
                var vv = a2.val * decay(a1.modified, now, opt.associations.halflife) 
                       - a1.val * decay(a2.modified, now, opt.associations.halflife);
                return vv; 
            }).slice(0, opt.associations.limit);

            var associds = unique(compare.expand(assocs
                .map(function(a) { return a.id; }))
                .sort());

            aclusters = cluster(associds, compare.similar);

            var clusterPairQueries = product(simclusters, aclusters, 
                function(simcluster, acluster, simid, aid) {
                    return function(cb) {
                        db.assoc.cooccurrences(simcluster, acluster, function acomp(err, res) {
                            if (err) return cb(err);
                            cb(null, {
                                simid:simid, aid: aid, 
                                cooccurrences: res.cooccurrences || 0,
                                modified: res.modified 
                            });
                        }); 
                    };
                });
            async.parallel(clusterPairQueries, afterClusterPairQueries);            
        }

        function afterClusterPairQueries(err, pairs) {
           var simcounts = simclusters.map(clustercount),
               acounts   = aclusters.map(clustercount);
            var avalues = {};
            pairs.forEach(function(pair) {
                if (!pair.cooccurrences) return;
                if (!avalues[pair.aid]) avalues[pair.aid] = 0;
                var decayedCooccurrences = pair.cooccurrences 
                    * decay(pair.modified, now, opt.associations.halflife);
                avalues[pair.aid] += 
                    pairing_formula(decayedCooccurrences, 
                                    simcounts[pair.simid], 
                                    acounts[pair.aid]);
            });
            var clusters = aclusters.map(function(items, i) {
                return { items: items, value: avalues[i] }
            }).sort(function(c1, c2) {
                return c2.value - c1.value;
            }).slice(0, opt.keywords.limit);
            return done(null, clusters);        
        } 

    };

    self.pick = function(sims, answers, done) {
        if (!answers.length) 
            return done(null, []);
        var now = Date.now()
        var simscc = clustercount(sims);
        var queries = answers.map(function(ans) {
            ans = subtract(ans, sims);
            return function(cb) {
                db.assoc.cooccurrences(sims, ans, function acomp(err, res) {
                    if (err) return cb(err);
                    var anscc = clustercount(ans);
                    var age = (now - res.modified) / 1000 / 3600 / 24;
                    var decayedCooccurrences = res.cooccurrences 
                        * decay(age, opt.associations.halflife);
                    var val = pairing_formula(res.cooccurrences, simscc, anscc);
                    cb(null, {answer: ans, val: val }); 
                });
            };
        });
        async.parallel(queries, function(err, results) {
            var best = results.sort(function(r1, r2) { return r2.val - r1.val }).shift();
            done(null, best.answer);
        });
    }
    return self;
}
