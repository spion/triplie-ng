module.exports = function(db, opt, cb) {
    var self = {};

    self.begin = function begin() {
        db.run('begin;');
    }
    self.end = function end() {
        db.run('commit;');
    }
    cb(null, self);
};
