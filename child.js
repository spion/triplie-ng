var ircee = require('ircee'),
    path = require('path'),
    net = require('net');





process.on('message', function(m, socket) {
    if (m.init) {
        var irc = ircee(),
            config;
        irc.use(require('ircee/core')),
        irc.reload = function() {
            process.send({reload: true});
        };
        irc.config = config = m.config;
        config.modules.forEach(function(m) {
            irc.use(require(path.join(__dirname, 'modules', m)));
        });
        console.log("child ipc channel", {path: m.ipc});
        var s = net.connect({path: m.ipc});
        s.pipe(irc).pipe(s);
    }
    if (m.connection) irc.emit('connect');
});

process.send({ready:true});
