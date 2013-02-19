#!/usr/bin/env node

var dbinit = require('../lib/db'),
    args = require('optimist').argv;
    split = require('split'),
    learner = require('../lib/learner');

dbinit({
    mode: 'feed',
    name: 'triplie.db'
}, function(err, db) {    
    var lines = 0;

    var learn = learner(db, {inBatch: true});
    var reg = new RegExp(args._);
    db.batch.begin();

    var last = Date.now();
    var learnQueue = async.queue(function(l, cb) {
        learn(l, function(err) {
            if (++lines % 20 == 0) 
                process.stdout.write('+');
            if (lines % 100 == 0) 
                process.stdout.write(' ');
            if (!(lines % 1000)) { 
                var spd = 1000 / ((Date.now() - last) / 1000);
                console.log((lines/1000).toFixed(0)+'K', 'at', spd.toFixed(1), 'l/s');
                last = Date.now();
            }
            cb(err);
        });
    }, 1);

    process.stdin.pipe(split()).on('data', function(line) {
        var m = line.match(reg);        
        if (m) learnQueue.push(m[1]);
    });

    learnQueue.drain =  function() {
        db.batch.end();
        db.close();
    };
});
