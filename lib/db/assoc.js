var async = require('async');

function onError(err) {
    if (err) {
        console.log("Error in assoc query: ", err);
        throw err;
    }
}

module.exports = function(db, opt, cb) {
    var self = {},
    table = {},
    list = [];

    function makeSet(len) {
        return '(' + new Array(len + 1).join(',?').slice(1) + ')'
    }
    db.serialize(function() {
        db.run('create table if not exists assoc (id1, id2, count, modified, primary key (id1, id2));');
        db.run('create index if not exists ix_assoc_id2 on assoc (id2);');

        var insert  = db.prepare('insert or ignore into assoc (id1, id2, count, modified) '
                                +'values (?, ?, 0, ?);'),
            update  = db.prepare('update assoc set count = count + 1, modified = ?3 '
                                +'where id1 = ?1 and id2 = ?2;');
        

        self.put = function put(pair, cb) {
            async.series([
               insert.run.bind(insert, pair),
               update.run.bind(update, pair)
            ], cb);        
        };

        self.find = function find(arg, cb) {
            var q = ' select id2 as id, sum(count) as count, avg(modified) '
                  + ' as modified, max(id1) as oid from assoc '
                  + ' where id1 in ' + makeSet(arg.length) + ' group by id2 '
                  + ' union'
                  + ' select id1 as id, sum(count) as count, avg(modified) '
                  + ' as modified, max(id2) as oid from assoc '
                  + ' where id2 in ' + makeSet(arg.length) + ' group by id1;'
            db.all(q, arg.concat(arg), cb);
        };

        self.cooccurrences = function compare(cluster1, cluster2, cb) {
                var q = ' select sum(count) as cooccurrences, avg(modified) as modified '
                      + ' from assoc  where' 
                      + ' (id1 in ' + makeSet(cluster1.length) + ' and '
                      + '  id2 in ' + makeSet(cluster2.length) + ')'
                      + ' or '
                      + ' (id1 in ' + makeSet(cluster2.length) + ' and '
                      + '  id2 in ' + makeSet(cluster1.length) + ')'
                      + ';'
                db.get(q, cluster1.concat(cluster2).concat(cluster2).concat(cluster1), cb)
        }

        self.get = function get(arg, cb) {
            getOne.get(arg[0], arg[1], cb); 
        };
        self.close = function close() {
            update.finalize();
            insert.finalize();
        };
        cb(null, self); 
    });
}
