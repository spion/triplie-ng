var async = require('async');

function makeSet(len) {
    return '(' + new Array(len + 1).join(',?').slice(1) + ')'
}

module.exports = function(db, opt, cb) {
    var self = {},
        table = {},
        list = [];

    db.serialize(function() {
        db.run('create table if not exists markov (id1, id2, id3, '
              +'id4, id5, primary key (id1, id2, id3, id4, id5));');

        db.run('create index if not exists ix_markov_id3 on markov (id3);');
        db.run('create index if not exists ix_markov_id5_4 on markov (id5, id4);');

        var insert  = db.prepare('insert or ignore into markov (id1, id2, id3, id4, id5) '
                                +'values (?, ?, ?, ?, ?);');
            //update  = db.prepare('update markov set count = count + 1 '
                                //+'where id1 = ? and id2 = ? and id3 = ? and id4 = ? and id5 = ?;');

        var creative5 = db.prepare('select m2.id3 as id, count(*) as count from markov m1 '
                                 +'join markov m2 on m1.id1 = m2.id1 and m1.id2 = m2.id2 '
                                 +'where m1.id1 = m2.id1 and m1.id2 = m2.id2 '
                                 +'and m1.id4 = m2.id4 and m1.id5 = m2.id5 '
                                 +'and m1.id2 != 0 and m2.id2 != 0 and m1.id4 != 1 and m2.id4 != 1 '
                                 +'and m1.id3 = ? group by m2.id3;');

        var creative3 = db.prepare('select m2.id2 as id, count(*) as count from markov m1 '
                                  +'join markov m2 on m1.id1 = m2.id1 '
                                  +'where m1.id1 = m2.id1 and m1.id3 = m2.id3 '
                                  +'and m1.id1 != 0 and m2.id1 != 0 and m1.id3 != 1 and m2.id3 != 1 '
                                  +'and m1.id2 = ? group by m2.id2;');

        var prev = [], next = [];

        for (var n = 2; n <= 5; ++n) {
            var r = 5 - n + 1;

            var nxt = 'select id' + n + ' as id from markov where ',
                prv = 'select id' + r + ' as id from markov where ';

            var ncond = [], pcond = [];
            for (var k = 1; k < n; ++k) {
                ncond.push('id'+k+'=?');
                pcond.push('id'+(k+r)+'=?');
            }
            var nstr = nxt + ncond.join(' and ') + ';',
                pstr = prv + pcond.join(' and ') + ';';

            next[n - 1] = db.prepare(nstr);
            prev[n - 1] = db.prepare(pstr);
        }

        self.put = function put(ngram, cb) {
            //async.series([
            //   insert.run.bind(insert, ngram[0], ngram[1], ngram[2], ngram[3], ngram[4]),
            //   update.run.bind(update, ngram[0], ngram[1], ngram[2], ngram[3], ngram[4]),
            //], cb);
            insert.run(ngram, cb);
        }
        self.next = function markov_next(arg, cb) {
            next[arg.length].all(arg, cb);
        }
        self.prev = function markov_prev(arg, cb) {
            prev[arg.length].all(arg, cb);
        }

        self.creative = function m_creative(id, n, cb) {
            console.log(id, n);
            if (n == 3) return creative3.all(id, cb);
            else return creative5.all(id, cb);
        }

        self.close = function close() {
            insert.finalize();
            for (var n = 1; n < 5; ++n) {
                next[n].finalize();
                prev[n].finalize();
            }
            creative3.finalize();
            creative5.finalize();
        };

        cb(null, self);
    });
}
