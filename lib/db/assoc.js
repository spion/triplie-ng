var async = require('async');

module.exports = function(db, opt, cb) {
    var self = {},
    table = {},
    list = [];

    function makeSet(len) {
        return '(' + new Array(len + 1).join(',?').slice(1) + ')'
    }
    db.serialize(function() {
        db.run('create table if not exists assoc (id1, id2, count, primary key (id1, id2));');
        db.run('create index if not exists ix_assoc_id2 on assoc (id2);');

        var insert  = db.prepare('insert or ignore into assoc (id1, id2, count) VALUES (?, ?, 0);'),
        update  = db.prepare('update assoc set count = count + 1 where id1 = ? and id2 = ?;'),
        

        self.put = function put(pair, cb) {
            var ps = pair.slice();
            ps.sort();;
            async.series([
               insert.run.bind(insert, ps[0], ps[1]),
               update.run.bind(update, ps[0], ps[1])
            ], cb);        
        };

        self.find = function find(arg, cb) {
            var q = ' select id2 as id from assoc where id1 in ' + makeSet(arg.length) 
                  + ' union'
                  + ' select id1 as id from assoc where id2 in ' + makeSet(arg.length) + ';'
            db.all(q, arg.concat(arg), cb) ;
        };

        self.coocurrences = function compare(cluster1, cluster2, cb) {
                var q = ' select sum(val) as cooccurrences, count(*) as count from assoc  where' 
                      + ' (id1 in ' + makeSet(cluster1.length) + ' and '
                      + '  id2 in ' + makeSet(cluster2.length) + ')'
                      + ' or '
                      + ' (id1 in ' + makeSet(cluster2.length) + ' and '
                      + '  id2 in ' + makeSet(cluster1.length) + ')'
                      + ';'
                q.get(cluster1.concat(cluster2).concat(cluster2).concat(cluster1), cb)
        }

        self.get = function get(arg, cb) {
            getOne.get(arg[0], arg[1], cb); 
        };
        self.close = function close() {
            update.finalize();
            insert.finalize();
            getOne.finalize();
            getMany.finalize();
        };
        cb(null, self); 
    });
}
