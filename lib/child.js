var ircee = require('ircee'),
    path = require('path'),
    net = require('net');

var irc;

process.on('message', function(m, socket) {
    if (m.init) {
        irc = ircee();
        irc.use(require('ircee/core')),
        irc.reload = function() {
            process.send({reload: true});
        };
        irc.config = m.config;
        irc.config.modules.forEach(function(m) {
            irc.use(require(path.join(__dirname, '..', 'modules', m)));
        });
        console.log("child: connecting to ipc channel", {path: m.ipc});
        var s = net.connect({path: m.ipc});
        s.pipe(irc, {end: false}).pipe(s);
    }
    if (m.connection && irc) irc.emit('connect');
});

process.send({ready:true});
