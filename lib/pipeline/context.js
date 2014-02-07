
var tokenize = require('../tokenize');

module.exports = function(db, opt) {
    return function(lines, ts) {
        if (!(lines instanceof Array))
            return tokenize(lines).map(function(w) {
                return _.extend({value: 1}, db.dict.get(w));
            });
        return lines.reduce(function(words, l) {
            var halflifes = (ts - l.timestamp) / (opt.context.halflife * 1000);
            var value = Math.pow(2, 0 - halflifes);
            return words.concat(
                tokenize(l.text).map(function(w) {
                    var wrd = db.dict.get(w);
                    if (wrd) wrd.value = value;
                    return wrd;
                }))
        }, []);

    }
}
