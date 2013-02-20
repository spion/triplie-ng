var alg = {    
    keywords: require('./pipeline/keywords'),
    porter: require('./pipeline/porter'),
    levenshtein: require('./pipeline/levenshtein'),
    noexpand: require('./pipeline/noexpand'),
    associate: require('./pipeline/associate'),
    creative: require('./pipeline/creative'),
    markov: require('./pipeline/markov'),
}; 

var tokenize = require('./tokenize'),
    unique = require('./util').unique;

var defaultOptions = require('./pipeline/options').defaults;


module.exports = function(db, opt) {
    opt = defaultOptions(opt);

    var keywords = alg.keywords(db, opt.keywords);

    var compare = opt.similars.algorithm == 'porter' 
        ? alg.porter(db, opt.similars)
        : opt.stemmer.algorithm == 'levenshtein'
        ? alg.levenshtein(db, opt.similars)
        : alg.noexpand(db, opt.similars)
  
    var associate = alg.associate(db, opt, compare);
    var creative = alg.creative(db, opt);
    var markov = alg.markov(db, opt);

    return function reply(text, done) {              
        console.log("Reply to ", text);
        var words = tokenize(text).map(function(w) { 
            return db.dict.get(w);
        });

        var ids = keywords(words);
        var similarids = unique(compare.expand(ids).sort())

        console.log("full set of keywords", similarids);

        associate(similarids, afterAssociate);
        function afterAssociate(err, aclusters) {
            console.log("afterAssociate", aclusters);
            creative(aclusters, afterCreative);
        };
        function afterCreative(err, creclusters) {
            //console.log("afterCreative", creclusters);
            markov(creclusters, afterMarkov)
        }

        function afterMarkov(err, answerIds) {
            if (err) return done(err);
            var tokens = answerIds.map(function(id) { return db.dict.get(id).word; });
            done(null, tokenize.undo(tokens));
        };

    };
};
