

var PWord = exports.PWord = function PWord(o) {
    if (!(this instanceof PWord))
        return new PWord(o);
    this.id = o.id;
    this.alternative = o.alternative || o.id;
    this.creative = o.creative || o.alternative || o.id;
    this.val = o.val || 0;
    return true;
}

var pwordKeys = ['id', 'alternative', 'creative', 'val'];

PWord.prototype.produce = function(which, values) {
    var self = new PWord(this);
    for (var key in self) 
        if (pwordKeys.indexOf(key) > pwordKeys.indexOf(which)) 
            delete self[key];
    return values.map(function(v) {        
        if (v instanceof Array) {
            self[which] = v[0];
            self.val = v[1];
        } else {
            self[which] = v;
        }
        return new PWord(self);
    });
}

exports.pre = function pipeline_pre(ids) {
    // Return a pipeline array
    return ids.map(function(id) { return new PWord(id); });
};

exports.post = function pipeline_post(pwords) {
    // Do not use creative as its only used for the markov search.
    return pwords.map(function(pw) { return pw.alternative; });
}

exports.parse = function pipeline_parse(descriptor) {
    var desc = descriptor.match(/([a-z]+)(\{([,:0-9a-z"'\[\]]+)\})?/),
        args = desc[3] ? desc[3].split(',').map(function(item) { return item.split(':') }) : [],
        argo = {};
        args.forEach(function(arg) { argo[arg[0]] = arg[1]; });
    return {name: desc[1], args: argo};
};

