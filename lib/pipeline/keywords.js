var kwutil = require('../keywords');

module.exports = function(db, opt) {
    var ref = db.dict.get(0).count;
    var extract = function extract(list) {
        return kwutil.extract(list, ref, opt.treshold)
            .map(function(w) { return w.id; });
    };
    extract.check = function(id) {
        return extract([db.dict.get(id)]).length;
    }
    return extract;
};
