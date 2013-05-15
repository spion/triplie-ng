#!/usr/bin/env node

var dbinit = require('../lib/db'),
    args = require('optimist').argv,
    split = require('split'),
    learner = require('../lib/learner');

function onError() {
}

dbinit({
    mode: 'feed',
    name: 'triplie.db'
}, function(err, db) {

    var lines = 0;

    var learn = learner(db, {inBatch: true});
    var reg = new RegExp(args._);
    db.batch.begin();

    var past = Date.now() - 30 * 24 * 3600 * 1000; // 30 days
    var last = Date.now();
    var learnQueue = async.queue(function(l, cb) {
        learn(l, past + lines * 5000, function(err) {
            if (++lines % 20 === 0)
                process.stdout.write('+');
            if (lines % 100 === 0)
                process.stdout.write(' ');
            if (lines % 1000 === 0) {
                var spd = 1000 / ((Date.now() - last) / 1000);
                console.log((lines/1000).toFixed(0)+'K', 'at', spd.toFixed(1), 'l/s');
                last = Date.now();
            }
            cb(err);
        });
    }, 1);

    var firstLine = true;
    process.stdin.pipe(split()).on('data', function(line) {
        var m = line.match(reg);
        if (firstLine) { console.log('First line is', m && m[1]); firstLine = false; }
        if (m) learnQueue.push(m[1]);
    });

    learnQueue.drain =  function() {
        db.batch.end();
        db.close(onError);
        console.log("=");
        console.log("done");
    };
});
