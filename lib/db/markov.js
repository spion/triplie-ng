var async = require('async');

module.exports = function(db, opt, cb) {
    var self = {},
    table = {},
    list = [];

    db.run('create table if not exists markov (id1 integer, id2 integer, id3 integer, '
          +'id4 integer, id5 integer, count integer, primary key (id1, id2, id3, id4, id5));')
    db.run('create index if not exists ix_markov_id3 on markov (id3);');
    db.run('create index if not exists ix_markov_id4_5 on markov (id5, id4);');

    var insert  = db.prepare('insert or ignore into markov (id1, id2, id3, id4, id5, count) VALUES (?, ?, ?, ?, ?, 0);'),
        update  = db.prepare('update markov set count = count + 1 where id1 = ? and id2 = ? and id3 = ? and id4 = ? and id5 = ?;');

    var prev = [], next = [];
    
    for (var n = 2; n <= 5; ++n) {
        var n = 'select id' +  n      + ' from markov where ',
            p = 'select id' + (5-n+1) + ' from markov where ';
        var ncond = [], pcond = [];
        for (var k = 1; k < n; ++k) {
            ncond.push('id'+k+'=?');
            pcond.push('id'+(5-k+1)+'=?');
        }
        next[n] = db.prepare(n + ncod.join(' and ') + ';');
        prev[n] = db.prepare(p + pcod.join(' and ') + ';');
    }

    self.put = function put(ngram, cb) {
        pair = pair.sort();
        async.parallel([
           insert.run.bind(insert, ngram[0], ngram[1], ngram[2], ngram[3], ngram[4]),
           update.run.bind(update, ngram[0], ngram[1], ngram[2], ngram[3], ngram[4]),
        ], cb);        
    }
    self.next = function get(arg, cb) {
        next[arg.length].run(arg, cb);
    }
    self.prev = function prev(arg, cb) {
        next[arg.length].run(arg, cb); 
    }

    cb(null, self); 
}
