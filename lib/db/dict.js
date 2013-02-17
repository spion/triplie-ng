var async = require('async');

module.exports = function(db, opt, cb) {
    var self = {},
        table = {},
        list = [],
        counter = 0;

    db.run('create table if not exists dict (id integer, word text, count integer, primary key id);')
    db.run('insert or ignore into dict (id, word, count) VALUES ((0, '', 0), (1, '', 0));');

    var insert = db.prepare('insert into dict (id, word, count) VALUES (?, ?, ?);'),
        update = db.prepare('update dict set count = ? where id = ?;');

    self.all = function all() {
        return list;
    }

    self.put = function put(word, cb) {
        if (typeof(word) == 'string')
            if (!table[word]) {
                var w = {id: list.length, word: word, count: 1};
                list.push(w);
                table[w.word] = w;
                insert.run(w.id, w.word, w.count, cb);           
            } else {
                var w = table[word];
                w.count += 1;
                update.run(w.count, w.id, cb);            
            }
        else {
            var w = list[word];
            w.count += 1;
            update.run(w.count, w.id, cb);
        }
    }
    self.get = function get(word) {
        if (typeof(word) == 'string') return table[word];
        else return list[word];
    }
    db.all('select * from dict', function(err, rows) {
        if (err) return cb(err);
        list = rows;
        list.forEach(function(row) {
            table[row.word] = row;
        });
        cb(null, self);
    });

}
