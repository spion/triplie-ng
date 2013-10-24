var ircee = require('ircee'),
    path = require('path'),
    net = require('net');


var irc;

var lastUsage = process.memoryUsage().rss;

global.hlog = function hlog(tag, data) {
    var mu = process.memoryUsage();
    //console.log('memory inc', ((mu.rss - lastUsage)/1024/1024).toFixed(1));
    //console.log(tag, data, (mu.rss/1024/1024).toFixed(1));
    lastUsage = mu.rss;
};


process.on('exit', function() {
    console.log(heaplog);
});

process.on('message', function(m, socket) {
    if (m.init) {
        irc = ircee();
        irc.use(require('ircee/core')),
        irc.supervisor = function(msg) {
            process.send(msg);
        }
        irc.config = m.config;
        irc.config.modules.forEach(function(m) {
            // core module
            if (m[0] != '.' && m[0] != '/')
                irc.use(require(path.join(__dirname, '..', 'modules', m)));
            else
                irc.use(require(path.resolve(
                    path.dirname(irc.config.__file), m)));
        });
        console.log("child: connecting to ipc channel", m.ipc);
        var s = net.connect(m.ipc);
        s.pipe(irc, {end: false}).pipe(s);
    }
    if (m.connection && irc) irc.emit('connect');
});

process.send({ready:true});
