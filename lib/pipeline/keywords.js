var kwutil = require('../keywords');

module.exports = function(db, opt) {
    var ref = db.dict.get(0).count;
    var extract = function extract(list) {
        return kwutil.extract(list, ref, opt.threshold);
    };
    extract.check = function(id) {
        return extract([db.dict.get(id)]).length;
    }
    return extract;
};
