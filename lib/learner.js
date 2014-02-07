var tokenize = require('./tokenize.js'),
    kwlib    = require('./keywords.js'),
    async    = require('async'),
    product = require('./util').product;

module.exports = function(db, opt) {
    opt = opt || {};
    opt.keywords = opt.keywords || {};
    opt.keywords.threshold = opt.keywords.threshold || 200;

    return function learn(text, time, done) {

        //console.log('---', text);

        var objwords = [];
        var words = tokenize(text);
        if (!words.length) return done && done();
        var dictionaryPuts = words.map(function(w) {
            return db.dict.put.bind(db.dict, w, time);
        });
        // initial and final words
        dictionaryPuts.push(db.dict.put.bind(db.dict, 0, time));
        dictionaryPuts.push(db.dict.put.bind(db.dict, 1, time));

        //if (!opt.inBatch) db.batch.begin();

        //console.log("dictionaryputs");
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
                markovPuts.push(db.markov.put.bind(null, ids.slice(k, k+5)));
            }
            //console.log("markovPuts");
            async.parallel(markovPuts, assocs)
        }

        function assocs(err) {
            if (err) return done(err);

            var reference = db.dict.get(0).count;

            var keywords = kwlib.extract(objwords, reference,
                                         opt.keywords.threshold)
                .map(function(w) { return w.id; });


            var assocPuts = product(keywords, keywords, function(kw1, kw2) {
                return [kw1, kw2, time]
            }).filter(function(pair) {
                return pair[0] - pair[1] < 0;
            }).map(function(pair) {
                return db.assoc.put.bind(null, pair);
            });
            //console.log('assocPuts');
            async.parallel(assocPuts, finalize);

        }
        function finalize(err) {
            //console.log('finalize');
            if (err) return done && done(err);
            //if (!opt.inBatch) db.batch.end();
            //console.log('--/', text);
            done && done(null, true);
        }
    }
}
