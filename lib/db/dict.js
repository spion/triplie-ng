var async = require('async');

function onError(err) {
    if (err) {
        console.log("Error in dict query: ", err);
        throw err;
    }
}
module.exports = function(db, opt, cb) {
    var self = {},
        table = {},
        list = [],
        counter = 0;

    db.serialize(function() {
        db.run("create table if not exists dict (id integer primary key, word, count, modified);",
              onError);
        db.run("insert or ignore into dict VALUES (0, '', 1, 0);", onError);
        db.run("insert or ignore into dict VALUES (1, '', 1, 0);", onError);

        var insert = db.prepare('insert into dict VALUES (?, ?, ?, ?);', onError),
            update = db.prepare('update dict set count = ?2, modified = ?3 where id = ?1;', onError);

        self.all = function all() {
            return list;
        }

        self.put = function put(word, time, cb) {
            if (typeof(word) == 'string')
                if (!table[word]) {
                    var w = {id: list.length, word: word, count: 1, modified: time};
                    list.push(w);
                    table[w.word] = w;
                    insert.run(w.id, w.word, w.count, w.modified, cb);           
                } else {
                    var w = table[word];
                    w.count += 1;
                    w.modified = time;
                    update.run(w.id, w.count, w.modified, cb);            
                }
                else {
                    var w = list[word];
                    w.count += 1;
                    w.modified = time; 
                    update.run(w.id, w.count, w.modified, cb);
                }
        }
        self.get = function get(word) {
            if (typeof(word) == 'string') 
                return table[word];
            else 
                return list[word];
        };
        self.close = function close() {
            insert.finalize();
            update.finalize();
        };

        db.all('select * from dict;', function(err, rows) {
            if (err) return cb(err);
            list = rows;
            list.forEach(function(row) {
                table[row.word] = row;
            });
            cb(null, self);
        });
    });
}
