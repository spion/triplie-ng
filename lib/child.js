var ircee = require('ircee'),
    path = require('path'),
    net = require('net');

var irc;

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
        console.log("child: connecting to ipc channel", {path: m.ipc});
        var s = net.connect({path: m.ipc});
        s.pipe(irc, {end: false}).pipe(s);
    }
    if (m.connection && irc) irc.emit('connect');
});

process.send({ready:true});
