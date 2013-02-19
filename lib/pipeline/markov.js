
var bfs = require('async-bfs');

// clusters is an array of arrays
// containing original and id.
// What we need is to pick the smallest cluster
// and expand it until we hit another cluster.
// We can do this by passing an expansion function which 
// when invoked on the cluster gives all alternatives as 
// available moves, otherwise gives a markov chain.
 
module.exports = function(db, opt) {
    
    opt.ngram = opt.ngram || {};

    opt.ngram.length = opt.ngram.length || 4;

    opt.ngram.min = opt.ngram.min || 2;
    opt.ngram.max = opt.ngram.max || 8;

    function A(alt) {
        this.id = alt.id;
        this.original = alt.original;
        return true;
    };

    A.prototype.toString = function() { return this.id.toString(); }
    A.prototype.valueOf = function() { return this.id; }

    return function(clusers, cb) {

        var goalStartEnd = 4;

        clusers = clusers.sort(function(c1, c2) { return c1.length - c2.length; });

        var clustart = clusers[0],
            found = {0: true};
            fcount = 1;

        var glen = opt.
        var move = {
            right: function right(chain, callback) {
                if (chain == 'cluster') 
                    return callback(null, clustart.map(function(item) { return [new A(item)]; }));
                else {
                    var ch = chain.map(function(item) { return item.valueOf(); });
                    db.markov.next(ch, function(err, words) {
                        return callback(null, words.map(function(w) {
                            var newc = chain.concat([w]);
                            if (newc.length > opt.ngram.length - 1) 
                                newc.shift();
                            return newc;
                        }));
                    })

                }
            },
            left: function left(chain, callback) {
                var ch = chain.map(function(item) { return item.valueOf(); })
                db.markov.prev(ch, function(err, words)) {
                    return callback(null, words.map(function(w) {
                        var newc = [w].concat(chain);
                        if (newc.length > opt.ngram.length - 1)
                            newc.pop();
                        return newc;
                    }));
                }
            }
        };
        function makeGoal(direction) {
            return function goal(chain, callback) {
                var id = chain[direction.right ? chain.length - 1 : 0].valueOf();
                if (fcount > goalStartEnd && id == 0 || id == 1) {
                    ++fcount;
                    return callback(null, true);
                }
                for (var i = 0; i < clusters.length; ++i) {
                    if (!found[i]) {
                        var c = clusters[i];
                        for (var j = 0; j < c.length; ++j) {
                            if (c[j].id == id) {
                                found[i] = true;
                                ++fcount;
                                chain[chain.length - 1] = new A(c[j]);
                                return callback(null, true);
                            }
                        }
                    }
                }
                return callback(null, false);
            };
        }
        var goal = { 
            left: makeGoal({left: true}),
            right: makeGoal({right: true})
        };

        function normalize(path, direction) {
            return path.filter(function(chain) { return chain != 'cluster' })
                .map(function(chain) { 
                    return chain[direction.right ? chain.length - 1 : 0]; 
                });
                
        }

        bfs('cluster', move.right, goal.right, function(err, res) {
            loopRight(err, res, []);
        });

        function loopRight(err, chains, path) {
            if (chains) {
                var patch = normalize(chains, {right: true});
                path = path.concat(patch.slice(1))
            } 
            else if (path[path.length] != 1) {
                path = path.concat([1]); // artificially end it.
            }
            if (complete(path)) return;
            var leftpart = path.slice(0, opt.ngram.length - 1);
            bfs(leftpart, move.left, goal.left, function(err, res) {
                loopLeft(err, res, path);
            });
        }
        function loopLeft(err, chains, path) {
            if (chains) {
                var patch = normalize(chains, {left: true});
                path = patch.concat(path.slice(1));
            } else if (path[0] != 0) {
                path = [0].concat(path); // artificially begin it.
            }
            if (complete(path)) return;
            
            var rightpart = path.slice(path.length - opt.ngram.length + 1);

            bfs(rightpart, move.right, goal.right, function(err, res) {
                loopRight(err, res, path);
            });
        }

        function complete(path, leftState, rightState) {
            if (path[0].valueOf() == 0 && path[path.length - 1].valueOf() == 1)
                cb(null, path.map(function(item) {
                    return item.original || item.valueOf();
                });
            return true;
        }
      


        cb(list); 
    };
}
