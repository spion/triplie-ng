module.exports = function(db, opt) {
    var self = {};
    self.similar = function noexpand_similar(w1, w2) { 
        return w1 == w2;
    }
    self.expand = function noexpand_expand(list) {
        return list;
    }
    return self;
}
