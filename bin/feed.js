#!/usr/bin/env node

var dbinit = require('../lib/db'),
    args = require('optimist').argv,
    split = require('split'),
    learner = require('../lib/learner'),
    XRegExp = require('xregexp').XRegExp,
    Config = require('../lib/config'),
    async = require('async');

function createTimestamp(spec, defaults) {
    if (spec.timestampms) 
        return spec.timestampms;
    else if (spec.timestamp)
        return spec.timestamp * 1000;
    spec.year = spec.year || defaults.getYear();
    spec.month = spec.month || defaults.getMonth() + 1;
    spec.day = spec.day  || defaults.getDay();
    spec.hour = spec.hour || defauls.getHours();
    spec.minute = spec.minute || defaults.getMinutes();
    spec.second = spec.second || defaults.getSeconds();
    return new Date(spec.year, spec.month - 1, spec.day, spec.hour, 
                    spec.minute, spec.second).getTime();
}


var config = Config.load(args);

dbinit({
    mode: 'feed',
    name: config.db || 'triplie.db'
}, function(err, db) {

    var lines = 0;

    var learn = learner(db, {inBatch: true});
    db.batch.begin();

    var past = Date.now() - 30 * 24 * 3600 * 1000; // 30 days
    var last = Date.now();
    var learnQueue = async.queue(function(l, cb) {
        learn(l.text, l.timestamp || (past + lines * 5000), function(err) {
            if (++lines % 20 === 0)
                process.stdout.write('+');
            if (lines % 100 === 0)
                process.stdout.write(' ');
            if (lines % 1000 === 0) {
                var spd = 1000 / ((Date.now() - last) / 1000);
                console.log((lines/1000).toFixed(0)+'K', 'at', 
                            spd.toFixed(1), 'l/s');
                last = Date.now();
            }
            cb(err);
        });
    }, 1);

    var firstLine = true;
    var today = new Date();
    var reg = new XRegExp(args.regex); 
    process.stdin.pipe(split()).on('data', function(line) {
        var m = XRegExp.exec(line, reg);
        var ts = null;
        if (!m) return;
        if (m.year || m.month || m.day || m.hour || m.minute 
            || m.second || m.timestamp || m.timestampms)
            ts = createTimestamp(m, today);
        if (firstLine) { 
            console.log('First line is', m && m.text); 
            console.log('Happening at', new Date(ts));
            firstLine = false; 
        }
        if (m) learnQueue.push({text: m.text, timestamp: ts});
    });

    learnQueue.drain =  function() {
        db.batch.end();
        db.close(function() {});
        console.log("=");
        console.log("done");
    };
});
