module.exports = function(irc) {
    irc.on('connect', function() {
        var core = irc.use(require('ircee/core'));
        core.login(irc.config.info);
    });
    irc.on('001', function(e) {
        (irc.config.channels || []).forEach(function(c) {
            irc.send('join', c);
        });
    });
}
