var learner = require('../lib/learner'),
    replyer = require('../lib/replyer');

module.exports = function(irc) {
    var db = irc.use(require('./db'));

    var learn, reply;

    db(dbready);
    function dbready(err, db) {   
       irc.on('privmsg', learnOrReply);
    };
    function learnOrReply(e) {
        var learn = learner(db, irc.config.learn),
            reply = replyer(db, irc.config.reply);
 
        if (e.text.trim().indexOf(irc.config.info.nick)) {
            var sendto = e.target[0] == '#' ? e.target : e.user.nick;
            reply(e.text, function(err, response) {
                response = response || irc.config.default_response;
                if (response) 
                    irc.send('privmsg', sendto, response);
            });
        }
        learn(e.text);
    }


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
