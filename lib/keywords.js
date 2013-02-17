
exports.extract = function(words, reference) {
    return words.map(function(w) { return reference / w.count > 1024; });
}
