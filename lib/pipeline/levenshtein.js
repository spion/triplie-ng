var leven = require('natural').LevenshteinDistance,
    expand = require('../util').expand;
    _ = require('lodash');    

module.exports = function(db, opt) {
    var self = {};
    var all = db.dict.all();

    self.similar = function leven_similar(w1, w2) {
        if (w1.id == w2.id) 
            return true;
        var s1 = w1, s2 = w2;
        return s1.length >= 6 && s2.length >= 6 
            && 2 * leven(s1, s2) / (s1.length + s2.length) 
                < (opt.percent || 30) / 100;
    }

    self.expand = function leven_expand(list) {
        return expand(list, all, self.similar);
    };
    return self;
}
