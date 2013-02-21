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
           var learn = learner(db, irc.config.ai),
           reply = replyer(db, irc.config.ai);

           if (~e.text.trim().indexOf(irc.config.info.nick) || e.target[0] != '#') {
               var sendto = e.target[0] == '#' ? e.target : e.user.nick;
               var prefix = sendto[0] == '#' ? e.user.nick + ', ' : '';
               reply(e.text, function(err, response) {
                   response =  response || irc.config.default_response;
                   if (response) 
                       irc.send('privmsg', sendto, prefix+response);
               });
           }
           learn(e.text, Date.now());
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
