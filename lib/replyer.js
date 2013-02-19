var alg = {    
    keywords: require('./pipeline/keywords'),
    porter: require('./pipeline/porter'),
    levenshtein: require('./pipeline/levenshtein'),
    noexpand: require('./pipeline/noexpand'),
    associate: require('./pipeline/associate'),
    creative: require('./pipeline/creative'),
    markov: require('./pipeline/markov'),
}; 

var tokenize = require('./tokenize');


function product(a1, a2, f) {
    return a1.reduce(function(acc, e1, i1) { 
        return acc.concat(a2.map(function(e2, i2) { 
            return f(e1, e2, i1, i2); 
        })); 
    }, []);
}

function unique(arr) {
    var a = arr.slice(), k = 1;
    while (k < a.length) 
        if (a[k] != a[k-1]) ++k
        else a.splice(k, 1);
    return a;
}

function defaultOptions(opt) {
    opt = opt || {}; 
    opt.similars = opt.similars || { };
    opt.similars.algorithm = opt.similars.algorithm || 'porter';

    opt.similars.percent = opt.similars.percent || 30;
    opt.similars.language = opt.similars.language || 'en';

    opt.keywords = opt.keywords || {};

    opt.keywords.treshold = opt.keywords.treshold || 1024;
    opt.keywords.limit = opt.keywords.limit || 15;

    opt.generalization = opt.generalization || 50;

    opt.creativity = opt.creativity || 100; 

    opt.ngram = opt.ngram || {};

    opt.ngram.length = opt.ngram.length || 4;
    if (opt.ngram.length < 2) 
        opt.ngram.length = 2;
    if (opt.ngram.length > 5) 
        opt.ngram.length = 5;

    opt.ngram.min = Math.max(2, opt.ngram.min || 2);
    opt.ngram.max = Math.min(opt.keywords.limit, opt.ngram.max || 6);

    return opt;
}


module.exports = function(db, opt) {
    opt = defaultOptions(opt);

    var keywords = alg.keywords(db, opt.keywords);
    var compare = opt.similars.algorithm == 'porter' 
        ? alg.porter(db, opt.similars),
        : opt.stemmer.algorithm == 'levenshtein' ?
          alg.levenshtein(db, opt.similars)
        : alg.noexpand(db, opt.similars)
  
    var associate = alg.associate(db, opt, compare);
    var creative = alg.creative(db, opt);
    var markov = alg.markov(db, opt);

    return function reply(text, done) {              
        var ids = tokenize(text).map(function(w) { 
            return db.dict.get(w).id 
        });

        ids = keywords(ids);

        var similarids = ids
            .map(function(id) { return compare.expand(id); }) 
            .reduce(function(acc, l) { return acc.concat(l); })
            .sort()

        similarids = unique(similarids);

        associate(similarIds, afterAssociate)
        function afterAssociate(err, aclusters) {
            // aclusters have {items: ids, value: val}
            creative(aclusters, afterCreative);
        };
        function afterCreative(err, creclusters) {
            // each crecluster is array of {original: id, id: id}
            markov(creclusters, afterMarkov)
        }

        function afterMarkov(err, answerIds) {
            if (err) return done(err);
            var tokens = answerIds.map(db.dict.get.bind(null))
            done(null, tokenize.undo(tokens));
        });

    };
};
