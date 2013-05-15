var bfs = require('async-bfs');

// clusters is an array of arrays
// containing original and id.
// What we need is to pick the smallest cluster
// and expand it until we hit another cluster.
// We can do this by passing an expansion function which 
// when invoked on the cluster gives all alternatives as 
// available moves, otherwise gives a markov chain.
 
var CLUSTER = -5;
var FIRST_WORD = 1.5;

var BEGINNING = 0, ENDING = 1;

var DEAD_END = -3; 

module.exports = function(db, opt) {
   

    function A(alt) {
        this.id = alt.id.valueOf();
        this.original = alt.original;
        return true;
    }

    A.prototype.toString = function() { return this.id.toString(); };
    A.prototype.valueOf = function() { return this.id; };

    return function(clusters, done) {
        var minKeywords = opt.answer.minkeys,
            minWords    = opt.answer.minwords;
            
        clusters = clusters.sort(function() { 
            return Math.random() - 0.5;
        }).filter(function(c) { 
            return c.length > 0; 
        });
        
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
                afterRight(err, res, []);
            });
        }


       function afterRight(err, chains, path) {
            if (chains) {
                var patch = normalize(chains, {right: true});
                path = path.concat(patch.slice(path.length ? 1 : 0));
            }
            else if (path[path.length] != ENDING) {
                path = path.concat([DEAD_END]); // artificially end it.
            }
            pathLength = path.length;
            if (complete(path)) return;
            var leftpart = path.slice(0, opt.ngram.length - 1);
            
            bfs(leftpart, move.left, goal.left, function(err, res) {
                afterLeft(err, res, path);
            });
        }
        function afterLeft(err, chains, path) {
            if (chains) {
                var patch = normalize(chains, {left: true});
                path = patch.concat(path.slice(1));
            } else if (path[0] != BEGINNING) {
                path = [DEAD_END].concat(path);
            }
            pathLength = path.length;
            if (complete(path)) return;
            
            var rightpart = path.slice(path.length - opt.ngram.length + 1);

            bfs(rightpart, move.right, goal.right, function(err, res) {
                afterRight(err, res, path);
            });
        }

        function values(chain) { 
            return chain.map(function(id) { 
                return id != null ? id.valueOf() : DEAD_END;
                //hasOwnProperty('id') ? id.id : id; 
            })
        }

        function stringify() { return '' + values(this); }
       

        function removeDead(word) { return null != word && null != word.id; }

        var move = {
            right: function right(depth, chain, callback) {
                if (depth > opt.ngram.depth 
                    || ~[DEAD_END, ENDING].indexOf(chain[chain.length - 1])) 
                    return callback(null, []);
                if (chain == CLUSTER) {
                    var res = clustart.map(function(item) { return [new A(item)] });
                    return callback(null, res);
                }
                db.markov.next(values(chain), function(err, words) {
                    return callback(null, words.filter(removeDead).map(function(w) {
                        var newc = chain.concat([w.id]);
                        if (newc.length > opt.ngram.length - 1) 
                            newc.shift();
                        newc.toString = stringify;
                        return newc;
                    }));
                })

            },
            left: function left(depth, chain, callback) {
                if (depth > opt.ngram.depth || 
                    ~[DEAD_END, BEGINNING].indexOf(chain[0])) 
                    return callback(null, []);
                
                db.markov.prev(values(chain), function(err, words) {
                    return callback(null, words.filter(removeDead).map(function(w) {
                        var newc = [w.id].concat(chain);
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
            if (!direction.right) 
                path = path.slice().reverse();
            var normal = path.filter(function(chain) { 
                return chain != CLUSTER 
            }).map(function(chain) { 
                return chain[direction.right ? chain.length - 1 : 0]; 
            });
            return normal;
        }


        var answers = [];
        bootstrap();
        function complete(path) {
            var first = path[0].valueOf(), 
            last = path[path.length - 1].valueOf();
            if (first < FIRST_WORD && last < FIRST_WORD) { 
                //console.log(path);
                if (first == BEGINNING && last == ENDING &&
                    fcount >= minKeywords && path.length >= minWords) {
                    process.nextTick(function() {
                        var withOriginals = path.map(function(item) {
                            return item.original || item.valueOf();
                        });
                        answers.push(withOriginals);
                    });
                   // console.log("Accept", db.dict.wordify(path));
                } else {
                    //console.log("Reject", db.dict.wordify(path));
                }
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
