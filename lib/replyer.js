var alg = {    
    keywords: require('./pipeline/keywords'),
    porter: require('./pipeline/porter'),
    levenshtein: require('./pipeline/levenshtein'),
    noexpand: require('./pipeline/noexpand'),
    associate: require('./pipeline/associate'),
    creative: require('./pipeline/creative'),
    markov: require('./pipeline/markov'),
    context: require('./pipeline/context')
}; 

var tokenize = require('./tokenize'),
    unique = require('./util').unique,
    async = require('async'),
    _ = require('lodash');

var defaultOptions = require('./pipeline/options').defaults;

module.exports = function(db, opt) {

    opt = defaultOptions(opt);

    var keywords = alg.keywords(db, opt.keywords);

    var compare = opt.similars.algorithm == 'porter' 
        ? alg.porter(db, opt.similars)
        : opt.similars.algorithm == 'levenshtein'
        ? alg.levenshtein(db, opt.similars)
        : alg.noexpand(db, opt.similars)

    var associate = alg.associate(db, opt, compare);
    var creative = alg.creative(db, opt, keywords);
    var markov = alg.markov(db, opt);

    var contextWords = alg.context(db, opt);

    return function reply(text, done) {              

        var words = contextWords(text);
        var keys = keywords(words);
        var expanded = compare.expand(keywords(words));

        var similars = unique(
            compare.expand(keywords(words)).sort(function(w1, w2) { 
                return w1.id - w2.id;
            }), function(w1, w2) {
                return w1.id == w2.id;
            });
        async.waterfall([
            associate.bind(associate, similars),
            creative.bind(creative),
            markov.bind(markov),
            associate.pick.bind(associate, similars)],             
            function afterPick(err, answerIds) {
                if (err) return done(err);
                var tokens = answerIds.map(function(id) { 
                    return db.dict.get(id).word; 
                });
                done(null, tokenize.undo(tokens));
            })
    };
};
