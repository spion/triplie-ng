var async = require('async'),
    cluster = require('../cluster'),
    unique = require('../util').unique,
    product = require('../util').product;

module.exports = function(db, opt, compare) {

    function clustercount(cl) { 
        return cl.reduce(function(acc, id) { 
            return acc + db.dict.get(id).count
        })
    }
    var generalization = opt.generalization / 100;
    function pairing_formula(cooccurrences, leftcount, rightcount) {
        return cooccurrences * Math.log(
            cooccurrences / 
            (generalization * leftcount + (1 - generalization) * rightcount));
    }

    return function associate(similarids, done) {

        var simclusters = cluster(similarids, compare.similar), aclusters;               

        console.log("similar clusters", simclusters);

        function afterAssociations(err, assocs) {
            var associds = assocs
                .map(function(a) { return compare.expand(a.id) })
                .reduce(function(acc, l) { return acc.concat(l); }, [])
                .sort();
            associds = unique(associds);

            aclusters = cluster(associds, compare.similar);
            var clusterPairQueries = product(simclusters, aclusters, 
                function(simcluster, acluster, simid, aid) {
                    return function(cb) {
                        db.assoc.compare(scluster, acluster, function compResult(err, res) {
                            if (err) return cb(err);
                            cb(null, {
                                simid:simid, aid: aid, 
                                cooccurrences: res.cooccurrences
                            });
                        }); 
                    };
                });
            async.parallel(clusterPairQueries, afterClusterPairQueries);            
        }

        function afterClusterPairQueries(err, pairs) {
            // now we have simclusters, aclusters, and pairs {simid, aid, cooccurrences }}
           var simcounts = simclusters.map(clustercount),
                acounts   = aclusters.map(clustercount);
            
            var avalues = {};
            pairs.forEach(function(pair) {
                if (!avals[pair.aid]) avalues[pair.aid] = 0;
                avalues[pair.aid] += 
                    pairing_formula(pair.cooccurrences, 
                                    simcounts[pair.simid], 
                                    acounts[pair.aid]);
            });
            var clusters = aclusters.map(function(items, i) {
                return { items: items, value: avalues[i] }
            }).sort(function(c1, c2) {
                return c2.value - c1.value;
            }).slice(opt.keywords.limit);

            return done(null, clusters);        
        } 

    };
}
