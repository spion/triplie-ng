var async = require('async');

module.exports = function(db, opt, cb) {
    var self = {},
    table = {},
    list = [];

    db.run('create table if not exists assoc (id1 integer, id2 integer, count integer, primary key (id1, id2));')
    db.run('create index if not exists ix_assoc_id2 on assoc (id2);');

    var insert  = db.prepare('insert or ignore into assoc (id1, id2, count) VALUES (?, ?, 0);'),
        update  = db.prepare('update assoc set count = count + 1 where id1 = ? and id2 = ?;'),
        getOne  = db.prepare('select * from assoc where id1 = ? and id2 = ?;'),
        getMany = db.prepare('select * from assoc where id1 = ? or id2 = ?;')

    self.put = function put(pair, cb) {
        pair = pair.sort();
        async.parallel([
           insert.run.bind(insert, pair[0], pair[1]),
           update.run.bind(update, pair[0], pair[1])
        ], cb);        
    };
    self.get = function get(arg, cb) {
        if (arg instanceof Array) 
            getOne(arg[0], arg[1], function(err, res) {
                if (err) return cb(err);
                else cb(null, res[0]);
            });
        else 
            getMany(arg, arg, cb);
    };
    cb(null, self); 
}
