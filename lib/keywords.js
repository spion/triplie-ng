
exports.extract = function(words, reference, ratio) {
    return words.filter(function(w) {
        return typeof(w) !== 'undefined'
            && reference / w.count > (ratio || 128);
    });
}
