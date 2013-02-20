var fs = require('fs');

module.exports = function(irc) {
    var admins = irc.config.admins || [];

    var isAdmin = exports.isAdmin = function isAdmin(address) {
        var f = admins.filter(function(a) { 
            return address.match(a);
        });
        return f.length;
    };
    
    var cmdchar = irc.config.chmdchar || '>'
    irc.on('privmsg', function(m) {
        if (m.text.length && m.text[0] == cmdchar && isAdmin(m.source)) {
            var which = m.text.substr(1).split(' ');
            var args = which.slice(1);
            args.unshift(m);
            cmds[which[0]].apply(cmds, args);
        }
    });


    function saveConfig() {
        irc.supervisor({save: JSON.stringify(irc.config, null, 4)});
    }
    var cmds = {};

    cmds.reload = function() {
        irc.supervisor({reload: true});
    };
    cmds.admin = function(m) {
        irc.send('privmsg', m.target, 'Yes you are.');
    }

    cmds.join = function(m, chan) {
        if (!~irc.config.channels.indexOf(chan)) {
            irc.config.channels.push(chan);
            saveConfig();
        }
        irc.send('join', chan);
    };
    cmds.part = function(m, chan) {
        if (~irc.config.channels.indexOf(chan)) {
            irc.config.channels.splice(irc.config.channels.indexOf(chan), 1);
            saveConfig();;
        }
        irc.send('part', chan || m.target);
    };  

    cmds.get = function(m, jpath) {
        path = jpath.split(/[\[\]\.]+/g);
        var c = irc.config;
        while (c && path.length) 
            c = c[path.shift()];
        irc.send('privmsg', m.target, JSON.stringify(c));
    };
    cmds.set = function(m, jpath, val) {
        path = jpath.split(/[\[\]\.]+/g);
        var c = irc.config;
        while (c && path.length > 1) 
            c = c[path.shift()];
        var last = path.shift();
        c[last] = JSON.parse(val);
        saveConfig();
        irc.send('privmsg', m.target, last + ' = ' + JSON.stringify(c[last]));      
                 //+ " in " + JSON.stringify(c))
    }

};
