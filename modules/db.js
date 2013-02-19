var EventEmitter = require('events').EventEmitter;
var dbinit = require('../lib/db.js');

module.exports = function(irc) {

    var dbready = new EventEmitter(),
        db = null;
    dbinit({
        name: irc.config.db
    }, function(err, d) {
        if (err) 
            return dbready.emit('ready', err);
        db = d;
        dbready.emit('ready', null, d);
    });
    return function(cb) {
        if (db) cb(null, db);
        else dbready.on('ready', cb);
    };
};
