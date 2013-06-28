#!/usr/bin/env node

var args = require('optimist').argv,
    fs   = require('fs'),
    path = require('path');

if (args.init)
    fs.writeFileSync(path.resolve(process.cwd(), args._[0] || 'config.yaml'), 
                     fs.readFileSync(path.join(__dirname,'..','config.yaml')));
else if (args.feed)
    require('./feed.js');
else
    require('./bot.js');

