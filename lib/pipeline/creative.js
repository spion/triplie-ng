
module.exports = function(db, opt) {
    function creatives(ids, cb) { 
        if (!opt.creativity) 
            return cb(null, ids.map(function(id) {
                return {original: id, id: id};
            });
        async.parallel(ids.map(function(id) {
            return function(cb) {
                db.markov.creative(id, function(err, res) { 
                    if (err) return cb(err);
                    cb(null, res.filter(function(r) { 
                        return r.count > (5 - opt.creativity / 100 * 5)
                    }).map(function(r) { 
                        return { original: id, id: r.id };
                    }));

                });
            };
        }), function(err, creatives) {
            if (err) return cb(err);
            cb(null, creatives.reduce(function(acc, c) { 
                return acc.concat(c); 
            }));
        });
    };
 
    return function(clusters, cb) {        
        async.parallel(clusters.map(function(cluster) { 
            return creatives.bind(null, cluster.items)
        }, cb);
    };
}
