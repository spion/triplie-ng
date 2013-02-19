
exports.extract = function(words, reference, ratio) {
    return words.filter(function(w) { 
        return reference / w.count > (ratio || 1024); 
    });
}
