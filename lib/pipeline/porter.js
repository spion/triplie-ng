var natural = require('natural'),
    expand = require('../util').expand,
    _ = require('lodash');

function stemmer(which) {
    var engine = {
        en: 'PorterStemmer',
        ru: 'PorterStemmerRu',
        es: 'PorterStemmerEs'
    }[which];
    return natural[engine].stem.bind(natural[engine]);
}

// Cache previous stems
var stems = {};
var stemids = {};
var stemidmax = 0;

module.exports = function(db, opt) {
    var stemfn = stemmer(opt.language);

    var all = db.dict.all();

    db.dict.all().forEach(function(w) {
        var st = stems[w.id]
        if (!stems[w.id]) {
            var stem = stemfn(w.word);
            var stemid = stemids[stem];
            if (!stemid)
                stemids[stem] = stemid = ++stemidmax;
            stems[w.id] = stemid;
        }
    });

    var self = {};
    self.expand = function porter_expand(list) {
        return expand(list, all, self.similar);
    };
    self.similar = function porter_similar(w1, w2) {
        return stems[w1.id] == stems[w2.id];
    }
    return self;
}
