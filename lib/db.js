var sql = require('sql'),
    sqlite = require('sqlite3'); //.verbose(),
    async = require('async');

module.exports = function(opt, cb) {
    var self = {}, db;

    db = new sqlite.Database(opt.name);
    if (opt.mode == 'feed')
        db.run('PRAGMA synchronous = OFF;');

    self.close = function() {
        self.dict.close();
        self.markov.close();
        self.assoc.close();
        db.close();
    };

    async.series({
        dict:   require('./db/dict').bind(this, db, opt),
        markov: require('./db/markov').bind(this, db, opt),        
        assoc:  require('./db/assoc').bind(this, db, opt),
        batch:   require('./db/batch').bind(this, db, opt)
    }, function(err, res) {
        if (err) return cb(err);
        for (var key in res) 
            self[key] = res[key];
        cb(null, self);
    });    

}

