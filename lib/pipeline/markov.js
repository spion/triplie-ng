
var bfs = require('async-bfs');

// clusters is an array of arrays
// containing original and id.
// What we need is to pick the smallest cluster
// and expand it until we hit another cluster.
// We can do this by passing an expansion function which 
// when invoked on the cluster gives all alternatives as 
// available moves, otherwise gives a markov chain.
 
var CLUSTER = -2;
var FIRST_WORD = 2;

var BEGINNING = 0, ENDING = 1;

module.exports = function(db, opt) {
    
    opt.ngram = opt.ngram || {};

    opt.ngram.length = opt.ngram.length || 4;

    var minmax = opt.keywords.search || [2, 6];


    function A(alt) {
        this.id = alt.id;
        this.original = alt.original;
        return true;
    };

    A.prototype.toString = function() { return this.id.toString(); }
    A.prototype.valueOf = function() { return this.id; }

    return function(clusters, done) {


        var minKeywords = minmax[0],
            minWords    = minmax[1];
            

        clusters = clusters.sort(function(c1, c2) { return c2.value - c1.value; })
            .filter(function(c) { return c.length > 0; });
        

        var used;
        var clustart, found, fcount, pathLength;
      
        function bootstrap() {
            used = {};
            clustart = clusters.shift();
            found = {};
            fcount = 1;
            pathLength = 1;

            if (clusters.length <= minKeywords) 
                return finalize();

            bfs(CLUSTER, move.right, goal.right, function(err, res) {
                loopRight(err, res, []);
            });
        }


       function loopRight(err, chains, path) {
            if (chains) {
                var patch = normalize(chains, {right: true});
                path = path.concat(patch.slice(path.length ? 1 : 0))
            } 
            else if (path[path.length] != ENDING) {
                path = path.concat([ENDING]); // artificially end it.
            }
            pathLength = path.length;
            if (complete(path)) return;
            var leftpart = path.slice(0, opt.ngram.length - 1);
            
            //console.log("going left of ", leftpart);
            bfs(leftpart, move.left, goal.left, function(err, res) {
                loopLeft(err, res, path);
            });
        }
        function loopLeft(err, chains, path) {
            if (chains) {
                var patch = normalize(chains, {left: true});
                path = patch.concat(path.slice(1));
            } else if (path[0] != BEGINNING) {
                path = [BEGINNING].concat(path); // artificially begin it.
            }
            pathLength = path.length;
            if (complete(path)) return;
            
            var rightpart = path.slice(path.length - opt.ngram.length + 1);

            //console.log("trying right of ", rightpart);
            bfs(rightpart, move.right, goal.right, function(err, res) {
                loopRight(err, res, path);
            });
        }

        function values(chain) { return chain.map(function(id) { return id.id || id; }) }

        function stringify() { return '' + values(this); }
        
        var move = {
            right: function right(depth, chain, callback) {
                if (depth > 10 || chain[chain.length - 1] == ENDING) 
                    return callback(null, []);
                //console.log("right from", chain.toString());
                if (chain == CLUSTER) {
                    var res = clustart.map(function(item) { return [new A(item)] });
                    return callback(null, res);
                }
                db.markov.next(values(chain), function(err, words) {
                    return callback(null, words.map(function(w) {
                        var newc = chain.concat([w.id]);
                        if (newc.length > opt.ngram.length - 1) 
                            newc.shift();
                        newc.toString = stringify;
                        return newc;
                    }));
                })

            },
            left: function left(depth, chain, callback) {
                if (depth > 10 || chain[0] == BEGINNING) 
                    return callback(null, []);
                //console.log("left from", chain);
                db.markov.prev(values(chain), function(err, words) {
                    return callback(null, words.map(function(w) {
                        var newc = [w].concat(chain);
                        if (newc.length > opt.ngram.length - 1)
                            newc.pop();
                        newc.toString = stringify;
                        return newc;
                    }));
                });
            }
        };
        function makeGoal(direction) {
            return function goal(chain, callback) {
                if (chain == CLUSTER) 
                    return callback(null, false);
                var id = chain[direction.right ? chain.length - 1 : 0].valueOf();
                if (fcount >= minKeywords && pathLength >= minWords  && id < FIRST_WORD) {
                    return callback(null, true);
                }
                for (var i = 0; i < clusters.length; ++i) {
                    if (!found[i]) {
                        var c = clusters[i];
                        for (var j = 0; j < c.length; ++j) {
                            if (c[j].id == id && !used[id]) {
                                //console.log("found goal", i,'as', id);
                                found[i] = true;
                                used[id] = true;
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
            return path.filter(function(chain) { return chain != CLUSTER })
                .map(function(chain) { 
                    return chain[direction.right ? chain.length - 1 : 0]; 
                });
        }


        var answers = [];
        bootstrap();
        function complete(path, leftState, rightState) {
            var first = path[0].valueOf(), 
            last = path[path.length - 1].valueOf();
            if (first == 0 && last == 1 || (first == last && (first == 0 || last == 1))) {
                console.log("path", fcount, minKeywords,  values(path));
                if (fcount >= minKeywords && path.length >= minWords)
                    process.nextTick(function() {
                        var withOriginals = path.map(function(item) {
                            return item.original || item.valueOf();
                        });
                        answers.push(withOriginals);
                    });
                bootstrap(); 
                return true;
            } 
            return false;
        }
        function finalize() {
            done(null, answers);
        }

    };
}
