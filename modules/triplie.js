var learner = require('../lib/learner'),
    replyer = require('../lib/replyer');
    Partake = require('../lib/partake'),
    aiopts  = require('../lib/pipeline/options.js');

module.exports = function(irc) {
    var db = irc.use(require('./db'));

    var learn, reply;

    
    var partake = Partake();

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

            var aiconf = aiopts.defaults(irc.config.ai);
            
            var shouldPartake =  e.target[0] == '#' &&
                    partake.decide(e.target, aiconf.partake.probability, 
                    aiconf.partake.traffic);

            var wasAddressed = ~e.text.trim().toLowerCase().indexOf(irc.config.info.nick.toLowerCase()),
                onChannel = e.target[0] == '#'
            
            var replyToMsg = !onChannel || shouldPartake || wasAddressed;


            if (!replyToMsg) 
                return learn(text, Date.now());

            var timeout = 1;
            if (aiconf.sleep) 
                timeout = (aiconf.sleep[0] 
                          + Math.random() * (aiconf.sleep[1] - aiconf.sleep[0])) 
                        * 1000;

            console.log("Timeout", timeout);

            console.log(e.user.nick, e.text);
            var reply = replyer(db, irc.config.ai);
            var sendto = onChannel ? e.target : e.user.nick;
            var prefix = wasAddressed && onChannel ? e.user.nick + ', ' : '';

            setTimeout(reply.bind(reply, text, function(err, response) {
                response =  response || irc.config.default_response;
                if (response) {
                    if (response.match(/^.action\s+/))
                        irc.send('privmsg', sendto, response);
                    else 
                        irc.send('privmsg', sendto, prefix + response);
                    console.log(sendto, prefix + response)
                }
                learn(text, Date.now());
            }), timeout);
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
