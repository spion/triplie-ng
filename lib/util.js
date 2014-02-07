exports.lookup = function lookup(list, keyfn) {
    var tbl = {};
    for (var k = 0, l = list.length; k < l; ++k)
        tbl[keyfn(list[k])] = list[k];
    return tbl;
}

//TODO: turn this into a generic function.
exports.expand = function expand(list, all, compare) {
    var results = [];
    for (var i = 0, il = all.length; i < il; ++i)
        for (var j = 0, jl = list.length; j < jl; ++j)
            if (compare(all[i], list[j])) {
                results.push(_.extend({}, all[i], {value: list[j].value}));
                break;
            }
    return results;
}

exports.unique = function unique(arr, cmp) {
    if (!cmp)
        cmp = function(a1, a2) { return a1 == a2 };
    var a = arr.slice(), k = 1;
    while (k < a.length)
        if (!cmp(a[k], a[k-1])) ++k
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

exports.indexOf = function indexOf(arr, item, cmp) {
    if (!cmp) cmp = function(i1, i2) { return i1 == i2; };
    for (var k = 0, l = arr.length; k < l; ++k)
        if (cmp(arr[k], item)) return k;
    return -1;
};
exports.subtract = function subtract(arr1, arr2, cmp) {
    return arr1.filter(function(item) {
        return !~exports.indexOf(arr2, item, cmp);
    });
};

exports.decay = function(t, now, halflife) {
    var age = (now - t) / 1000 / 3600 / 24;
    return Math.pow(2, 0 - age / halflife);
};

exports.confidence = function confidence(p, n) {
    if (n == 0)
        return 0;
    var z = 1.6; //1.0 = 85%, 1.6 = 95%
    var phat = p / n;
    return (phat + z*z/(2*n) - z * Math.sqrt((phat*(1-phat)+z*z/(4*n))/n))/(1+z*z/n);
}
