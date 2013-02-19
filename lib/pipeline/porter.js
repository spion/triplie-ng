var natural = require('natural'),
    PWord = require('./util').PWord;



function stemmer(which) {
    var engine = {
        en: 'PorterStemmer',
        ru: 'PorterStemmerRu',
        es: 'PorterStemmerEs'
    }[which], 
    return natural[engine].stem.bind(natural[engine]);
}

// Cache previous stems
var stems = {};

module.exports = function(db, opt) {
    opt = opt || {};
    opt.language = opt.language || 'en';
    var stemfn = stemmer(opt.language);

    var all = db.dict.all().map(function(w) { return w.id; });

    db.dict.all().forEach(function(w) { 
        if (!stems[w.id]) 
            stems[w.id] = stemfn(w.word);
    });

    var self = {};
    self.expand = function porter_expand(list) {
        return all.filter(function (id) {
            return list.filter(self.similar.bind(self, id)).length > 0
        });
    };
    self.similar = function porter_similar(w1, w2) {
        return stems[w1] == stems[w2];
    }
    return self;
}
