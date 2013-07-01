var learner = require('../lib/learner'),
    replyer = require('../lib/replyer'),
    request = require('request'),
    cheerio = require('cheerio'),
    async = require('async'),
    path = require('path'),
    URL  = require('url');


function readArticle(url, learn, db, done) {
    console.log("Reading", url);
    request(url, function(err, r, body) {
        if (err) return irc.send('privmsg', sendto, 'error:' + err.toString());
        var $ = cheerio.load(body.toLowerCase().replace(/(\r?\n)+/g,' '));
        var elements = $('p,font,td');
        if (!elements.length)
            elements = $('body');
        var material = elements.map(function() {
            return this.text() 
        }).reduce(function(acc, t) { 
            return acc.concat(t.split('. ')); 
        }, []).filter(function(s) {
            return s.length > 0 && s.split(' ').length > 3;
        })

        if (!material.length) {
            material = body.toLowerCase().replace(/(\r?\n)+/g,' ')
                .split(/.\s*/g);
        }

        db.batch.begin();
        async.map(material, function(line, cb) {
            learn(line, Date.now(), cb);
        }, function(err) {
            done(err, material);
        });
        db.batch.end();
    });
}

module.exports = function(irc) {
    var db = irc.use(require('./db')),    
        admin = irc.use(require('./admin'));

    db(function(err, db) {
        var cfg = JSON.parse(JSON.stringify(irc.config.ai));
        cfg.inBatch = true;
        var learn = learner(db, cfg); 
        admin.readall = function(e, url) {
            var sendto = e.target[0] == '#' ? e.target : e.user.nick;
            var base;
            if (url[url.length - 1] != '/')
                base = path.dirname(url) + '/';
            else 
                base = url;
            request(url, function(err, r, body) {
                var $l = cheerio.load(body);
                var links = $l('a').map(function() { 
                    var l = this.attr('href'); 
                    if (!l.match(/^https?:/))
                        if (l[0] == '/')
                            l = base.replace(URL.parse(base).path, l);
                        else 
                            l = base + l;
                     return l;
 
                });
                console.log(links);

                var reads = links.map(function(l) { 
                   return readArticle.bind(readArticle, l, learn, db);
                });
                async.series(reads, function(err, materials) {
                    if (err) return irc.send('privmsg', sendto, 'error:' + err.toString());
                    var lines = [].concat.apply([], materials).length;
                    irc.send('privmsg', sendto, 'Done, read ' + lines + ' lines.');

                });
            });
        };       
        admin.read = function(e, url) {
            var sendto = e.target[0] == '#' ? e.target : e.user.nick;
            readArticle(url, learn, db, function(err, material) {
                console.log('read', err, sendto);
                if (err) return irc.send('privmsg', sendto, 
                                         'error:' + err.toString());
                irc.send('privmsg', sendto, 
                         'Done, read ' + material.length + ' lines.');
            });

        };

    });
}


