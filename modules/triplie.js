var learner = require('../lib/learner'),
replyer = require('../lib/replyer');

module.exports = function(irc) {
    var db = irc.use(require('./db'));

    var learn, reply;

    db(dbready);
    function dbready(err, db) {   
        irc.on('privmsg', learnOrReply);
        function learnOrReply(e) {
            if (e.text[0] == irc.config.cmdchar) return;
            var learn = learner(db, irc.config.ai);
            var text = e.text.trim();
            if (text.indexOf(irc.config.info.nick) == 0)
                text = text
                    .replace(irc.config.info.nick,'')
                    .replace(/^[,:\s]+/,'');
 
            if (~e.text.trim().indexOf(irc.config.info.nick) || e.target[0] != '#') {
                console.log(e.user.nick, e.text);
                var reply = replyer(db, irc.config.ai);
                var sendto = e.target[0] == '#' ? e.target : e.user.nick;
                var prefix = sendto[0] == '#' ? e.user.nick + ', ' : '';
                reply(text, function(err, response) {
                    response =  response || irc.config.default_response;
                    if (response) {
                        if (response.match(/^.ACTION\s+/))
                            irc.send('privmsg', sendto, response);
                        else 
                            irc.send('privmsg', sendto, prefix + response);
                        console.log(sendto, prefix + response)
                    }
                });
            }
            learn(text, Date.now());
        }
    };


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
