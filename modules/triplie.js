var learner = require('../lib/learner'),
    replyer = require('../lib/replyer'),
    Partake = require('../lib/partake'),
    aiopts  = require('../lib/pipeline/options.js'),
    context = require('../lib/context');


function enoughLove(amount) {
    var love = Math.random() * 100,
        enough = love < amount;
    //console.log("got love =", amount,"; need =", love.toFixed(0));
    return enough;
}

module.exports = function(irc) {
    var db = irc.use(require('./db'));

    var learn, reply;

    var partake = Partake();

    var isIgnoredUser = module.exports.isIgnoredUser = function(address) {
	var _ref;
        var ignoredUsers = ((_ref = irc.config.ignore) != null ? _ref['users'] : void 0) || [];
        var f = ignoredUsers.filter(function (a) {
            return address.match(a);
        });
        return f.length;
    };

    db(dbready);
    function dbready(err, db) {


        irc.on('privmsg', learnOrReply);

        var ctx = context(aiopts.defaults(irc.config.ai).context.maxsize);

        function learnOrReply(e) {
            if (e.text[0] == irc.config.cmdchar) return;
            if (e.user.nick == irc.config.info.nick) return;
            if (isIgnoredUser(e.source)) {
                console.log('Ignored message from ' + e.source);
                return;
            }

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

            var wasAddressed = ~e.text.trim().toLowerCase()
                    .indexOf(irc.config.info.nick.toLowerCase()),
                onChannel = e.target[0] == '#';

            var love = irc.config.ai.love.for[e.user.nick];
            if (null == love) love = irc.config.ai.love.default;
            if (null == love) love = 100;

            var replyToMsg = (!onChannel || shouldPartake || wasAddressed)
                && enoughLove(love);

            ctx.push(e.user.nick, text, Date.now());

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

            setTimeout(reply.bind(reply, ctx.get(e.user.nick), function(err, response) {
                response =  response || irc.config.default_response;
                if (response) {
                    if (response.match(/^.action\s+/))
                        irc.send('privmsg', sendto, response);
                    else
                        irc.send('privmsg', sendto, prefix + response);
                    ctx.push(e.user.nick, prefix + response, Date.now());
                    console.log(sendto, prefix + response);
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
