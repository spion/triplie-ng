var async = require('async');

module.exports = function(db, opt, cb) {
    var self = {},
        table = {},
        list = [],
        counter = 0;

    db.serialize(function() {
        db.run("create table if not exists config (id integer primary key, data);");
        db.run("insert or ignore into config VALUES (1, '{}');");

        var update = db.prepare('update dict set data = ? where id = 1;');

        var conf;

        self.put = function put(config, cb) {
            conf = config;
            update.run(JSON.stringify(conf), cb);
        };
        self.get = function get() {
            return conf;
        };
        self.close = function close() {
            update.finalize();
        };

        db.get('select * from conf;', function(err, row) {
            if (err) return cb(err);
            conf = JSON.parse(row.data);
            cb(null, self);
        });
    });
}
