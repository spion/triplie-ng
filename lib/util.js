exports.unique = function unique(arr) {
    var a = arr.slice(), k = 1;
    while (k < a.length) 
        if (a[k] != a[k-1]) ++k
        else a.splice(k, 1);
    return a;
}

