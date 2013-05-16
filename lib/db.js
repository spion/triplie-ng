var sql = require('sql'),
    sqlite = require('sqlite3'), //.verbose(),
    async = require('async'),
    path = require('path');

module.exports = function(opt, cb) {
    var self = {}, db;



    opt.name = opt.name || ':memory:';
    
    // Make sure that relative db paths are 
    // relative to the config file.
    var dir = path.dirname(opt.configFile || '');
    if (opt.name[0] != ':' ) // :memory:
        opt.name = path.resolve(dir, opt.name);

    db = new sqlite.Database(opt.name);
    
    if (opt.mode == 'feed') {
        db.run('PRAGMA synchronous = OFF;');
    } 
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

