module.exports = function(irc) {
    var admins = irc.config.admins || [];

    var isAdmin = exports.isAdmin = function isAdmin(address) {
        var f = admins.filter(function(a) { 
            return address.match(a);
        });
        return f.length;
    };
    
    var cmdchar = irc.config.chmdchar || '>'

    var cmds = {};

    cmds.reload = function() {
        irc.reload();
    };
    cmds.admin = function(m) {
        irc.send('privmsg', m.target, 'Yes you are.');
    }
    cmds.join = function(m, chan) {
        irc.send('join', chan);
    };
    cmds.part = function(m, chan) {
        irc.send('part', chan || m.target);
    };    

    irc.on('privmsg', function(m) {
        if (m.text.length && m.text[0] == cmdchar && isAdmin(m.source)) {
            var which = m.text.substr(1).split(' ');
            var args = which.slice(1);
            args.unshift(m);
            cmds[which[0]].apply(cmds, args);
        }
    });

};
