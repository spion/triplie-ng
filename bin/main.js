#!/usr/bin/env node

var args = require('optimist').argv,
    fs   = require('fs'),
    path = require('path');

if (args.init)
    fs.writeFileSync(path.resolve(process.cwd(), args._[0] || 'config.json'), 
                     fs.readFileSync(path.join(__dirname,'..','config.json')));
else if (args.feed)
    require('./feed.js');
else
    require('./bot.js');

