var learner = require('../lib/learner'),
    replyer = require('../lib/replyer'),
    request = require('request'),
    cheerio = require('cheerio'),
    path = require('path');
    URL  = require('url');


function readArticle(url, learn, db, done) {
    console.log("Reading", url);
    request(url, function(err, r, body) {
        if (err) return irc.send('privmsg', sendto, 'error:' + err.toString());
        var $ = cheerio.load(body.toLowerCase());
        var material = $('p,font,td').map(function() {
            return this.text() 
        }).reduce(function(acc, t) { 
            return acc.concat(t.split('. ')); 
        }, []).filter(function(s) {
            return s.length > 0 && s.split(' ').length > 3;
        })

        db.batch.begin();
        async.parallel(material.map(function(line) {
            return function(cb) { 
                learn(line, cb); 
            };
        }), function(err) {
            db.batch.end();
            done(err, material);
        });
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
                    irc.send('privmsg', sendto, 'Done, read ' + material.length + ' lines.');

                });
            });
        };       
        admin.read = function(e, url) {
            var sendto = e.target[0] == '#' ? e.target : e.user.nick;
            readArticle(url, learn, db, function(err, material) {
                if (err) return irc.send('privmsg', sendto, 'error:' + err.toString());
                irc.send('privmsg', sendto, 'Done, read ' + material.length + ' lines.');
            });

        };

    });
}


