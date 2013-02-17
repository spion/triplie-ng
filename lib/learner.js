var tokenize = require('./tokenize.js'),
    kwlib    = require('./keywords.js'),
    async    = require('async');

module.exports = function(db) {


    return function learn(text, opt, done) {
        opt = opt || {};

        var objwords = [];
        var words = tokenize(text);
        var dictionaryPuts = words.map(function(w) { 
            return db.dict.put.bind(db.dict, w); 
        });
       
        if (!opt.inBatch) db.batch.begin();

        async.parallel(dictionaryPuts, markovs);

        function markovs(err) {
            if (err) return done(err);
            
            objwords = words.map(db.dict.get.bind(null));
            
            var ids =  objwords.map(function(w) { return w.id; });

            for (var k = 0; k < 4; ++k) {
                ids.unshift(0); //add beginnings
                ids.push(1); // add ends
            }

            var markovPuts = [];
            for (var k = 0; k < ids.length - 4; ++k) {
                markovPuts.push(db.markov.put.bind(null, ids.slice(k, 5)));
            }
            async.parallel(markovPuts, assocs)
        }

        function assocs(err) {            
            if (err) return done(err);

            var reference = words.get(0).count;            
            var keywords = kwlib.extract(objwords, reference)
                .map(function(w) { return w.id; });

            var assocPuts = keywords.map(function(kw1) {
                return keywords.map(function(kw2) { return [kw1, k2]; })
            }).filter(function(pair) { 
                return kw1 < kw2 
            }).map(function(pair) {
                return db.assoc.put.bind(null, pair);
            });
            async.parallel(assocPuts, finalize);            

        }
        function finalize(err) {
            if (err) return done(err);
            if (!opt.inBatch) db.batch.end();
            done();
        }
    }
}
