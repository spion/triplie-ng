var fs = require('fs');

module.exports = function(irc) {
    var db = irc.use(require('./db'));

    var admins = irc.config.admins || [];

    var isAdmin = exports.isAdmin = function isAdmin(address) {
        var f = admins.filter(function(a) {
            return address.match(a);
        });
        return f.length;
    };

    var cmdchar = irc.config.cmdchar || '>'

    irc.on('privmsg', function(m) {
        if (m.text.length && m.text[0] == cmdchar && isAdmin(m.source)) {
            var responder = {};

            var nochar = m.text.substr(1), which;
            if (nochar[0] != cmdchar) {
                which = nochar.split(' ');
                responder.respond = irc.send.bind(irc, 'notice', m.user.nick);
            }
            else {
                which = nochar.substr(1).split(' ');
                var sendto = m.target[0] == '#' ? m.target : m.user.nick;
                responder.respond = irc.send.bind(irc, 'privmsg', sendto);
            }
            var args = which.slice(1);
            args.unshift(m);

	    if (which[0] && typeof(cmds[which[0]]) === 'function')
		cmds[which[0]].apply(responder, args);
	    else
		responder.respond('no such command: ' + which[0]);
        }
    });


    function saveConfig() {
        delete irc.config['$0'];
        delete irc.config['_'];
        irc.supervisor({save: JSON.stringify(irc.config, null, 4)});
    }
    var cmds = {};

    cmds.reload = function() {
        irc.supervisor({reload: true});
    };
    cmds.admin = function(m) {
        irc.send('notice', m.user.nick, 'Yes you are');
    }

    cmds.join = function(m, chan) {
        if (!~irc.config.channels.indexOf(chan)) {
            irc.config.channels.push(chan);
            saveConfig();
        }
        irc.send('join', chan);
    };
    cmds.part = function(m, chan) {
        chan = chan || m.target;
        if (~irc.config.channels.indexOf(chan)) {
            irc.config.channels.splice(irc.config.channels.indexOf(chan), 1);
            saveConfig();;
        }
        irc.send('part', chan);
    };

    cmds.db = function(m, subcmd) {
        var self = this;
        var subcmds = {
            stats: function(m) {
                db(function(err, db) {
                    db.stats(function(err, stats) {
                        self.respond(JSON.stringify(stats));
                    });
                });
            }
        };
        if (subcmds[subcmd]) subcmds[subcmd](m);
    }

    cmds.get = function(m, jpath) {
        path = jpath.split(/[\[\]\.]+/g);
        var c = irc.config;
        while (c && path.length)
            c = c[path.shift()];
        this.respond(JSON.stringify(c));
    };
    cmds.set = function(m, jpath, val) {
        path = jpath.split(/[\[\]\.]+/g);
        var c = irc.config;
        while (c && path.length > 1)
            c = c[path.shift()];
        var last = path.shift();
        c[last] = JSON.parse(val);
        saveConfig();
        this.respond(last + ' = ' + JSON.stringify(c[last]));
                 //+ " in " + JSON.stringify(c))
    }

    return cmds;

};
