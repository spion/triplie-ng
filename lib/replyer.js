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
    unique = require('./util').unique,
    async = require('async');

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

    return function reply(text, done) {              

        if (text instanceof Array) {
            var wordlists = text.map(function(t) {
                return tokenize(t).map(function(w) { return db.dict.get(w); })
            });
        }

        var words = tokenize(text).map(function(w) { 
            return db.dict.get(w);
        });

        //var ids = keywords(words);
        var similarids = unique(compare.expand(keywords(words)).sort())
        console.log("full set of keywords", db.dict.wordify(similarids));

        async.waterfall([
            associate.bind(associate, similarids),
            creative.bind(creative),
            markov.bind(markov),
            associate.pick.bind(associate, similarids)],             
            function afterPick(err, answerIds) {
                if (err) return done(err);
                var tokens = answerIds.map(function(id) { return db.dict.get(id).word; });
                done(null, tokenize.undo(tokens));
            })
    };
};
