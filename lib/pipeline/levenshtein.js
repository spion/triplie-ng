var leven = require('natural').LevenshteinDistance,
    PWord = require('./util').PWord;

module.exports = function(db, opt) {
    var self = {};
    var all = db.dict.all().map(function(w) { return w.id; });

    self.similar = function leven_similar(w1, w2) {
        if (w1 == w2) 
            return true;
        var s1 = db.dict.get(w1).word, s2 = db.dict.get(w2).word;
        return s1.length >= 6 && s2.length >= 6 
            && 2 * leven(s1, s2) / (s1.length + s2.length) 
                < (opt.percent || 30) / 100;

    }
    self.expand = function leven_expand(list) {
        return all.filter(function (id) {
            return list.filter(self.similar.bind(self, id)).length > 0
        });
    };
    return self;
}
