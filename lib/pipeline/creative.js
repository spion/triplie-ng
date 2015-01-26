var async = require('async');

module.exports = function(db, opt, keywords) {

    var c1 = 0, c2 = 0
    function creatives(ids, value, cbdone) {
        if (!opt.creativity)
            return cbdone(null, ids.map(function(id) {
                return {original: id, id: id};
            }));
        async.parallel(ids.map(function(id) {
            return function(cb) {
                //todo: make 5/3 configurable
                db.markov.creative(id, 5, function(err, res) {
                    if (err) return cb(err);
                    cb(null, res.filter(function(r) {
                        return r.count > 10 * (1 - opt.creativity / 100)
                    }).map(function(r) {
                        return { original: id, id: r.id };
                    }).filter(function(r) {
                        return keywords.check(r.id);
                    }));

                });
            };
        }), function(err, creatives) {
            if (err) return cbdone(err);
            var complete = creatives.reduce(function(acc, c) {
                return acc.concat(c);
            });
            complete.value = value;
            cbdone(null, complete);
        });
    }

    return function(clusters, done) {
        async.parallel(clusters.map(function(cluster) {
            return creatives.bind(null, cluster.items, cluster.value)
        }), function(err, results) {
            console.log("creativity expansion complete");
            done(err, results);
        });
    };
}
