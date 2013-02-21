exports.unique = function unique(arr) {
    var a = arr.slice(), k = 1;
    while (k < a.length) 
        if (a[k] != a[k-1]) ++k
        else a.splice(k, 1);
    return a;
}
exports.product = function product(a1, a2, f) {
    return a1.reduce(function(acc, e1, i1) { 
        return acc.concat(a2.map(function(e2, i2) { 
            return f(e1, e2, i1, i2); 
        })); 
    }, []);
}
exports.cluster = function cluster(l, compare) {
    // dont destroy the original list.
    var list = l.slice(); 
    function expand(item) {
        var group = item, k = 0;
        while (k < list.length)
            if (compare(list[k], item)) 
                group = group.concat(expand(list.splice(k, 1)));
        else
            ++k;
        return group;
    };
    var clusters = [];
    while (list.length) 
        clusters.push(expand([list.shift()]));
    return clusters;        
}

exports.subtract = function subtract(arr1, arr2) {
    return arr1.filter(function(item) { return !~arr2.indexOf(item); });
};

exports.decay = function(t, now, halflife) {
    var age = (now - t) / 1000 / 3600 / 24;
    return Math.pow(2, 0 - age/halflife); 
}
