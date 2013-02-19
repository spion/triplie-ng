function cluster(l, compare) {
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

module.exports = cluster; 
