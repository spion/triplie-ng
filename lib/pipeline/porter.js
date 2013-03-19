var natural = require('natural'),
    PWord = require('./util').PWord;

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

    var all = db.dict.all().map(function(w) { return w.id; });

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

    //console.log(stems); 
    var self = {};
    self.expand = function porter_expand(list) {
        var t = Date.now();
        var results = [];
        for (var i = 0, il = all.length; i < il; ++i) 
            for (var j = 0, jl = list.length; j < jl; ++j) 
                if (stems[all[i]] ==  stems[list[j]]) {
                    results.push(all[i]);
                    break;
                }
        //console.log(list.length * all.length / (Date.now() - t), 'comp/ms');
        //console.log('Done in', (Date.now() - t) / 1000, 's');
        //console.log(list.length, 'became', results.length, 'results');
        return results;
    };
    self.similar = function porter_similar(w1, w2) {
        return stems[w1] == stems[w2];
    }
    return self;
}
