var args = require('optimist').argv;
var ircee = require('ircee');
var cp = require('child_process');
var net = require('net');
var through = require('through');

var EventEmitter = require('events').EventEmitter;

var path = require('path');

function loadConfig(file) {   
    var cfgFile = file || path.join(process.cwd(), 'config.js');
    if (require.cache[cfgFile]) 
        delete require.cache[cfgFile]
    var config = require(cfgFile);
    for (var key in args) 
        config[key] = args[key];
    return config;
}

function connection(config) {
    var irc =  ircee(),
        self = new EventEmitter();

    irc.config = config;
    irc.use(require('ircee/core'));

    var instream = through(),
        outstream = through();        
 
    irc.instream = instream;
    irc.outstream = outstream;

    function connect() {
        var socket = net.connect(config.port, config.server);
        socket.pipe(instream, {end: false});
        outstream.pipe(socket, {end: false});
        socket.pipe(irc).pipe(socket);
    };
    irc.on('close', function() { 
        setTimeout(function() {
            connect() 
        }, irc.config.reconnectDelay * 1000 || 5000);
    });

    connect();
    return irc;
}

function child(irc) {    

    var ipcadr = '/tmp/triplie-' + process.pid + '.sock';

    var config = loadConfig(),
        self = {},
        socket = null,
        ipc = net.createServer(function(cli) {
            console.log("child IPC connected in parent");
            irc.instream.pipe(cli, {end: false});
            cli.pipe(irc.outstream, {end: false});
        }),
        child = run(config);

    ipc.listen(ipcadr);

    irc.on('connect', function() {        
        function childReady(k) {
            if (child) 
                child.send({connect: true});
            else if (k < 10) 
                setTimeout(childReady, 1000); // try again in 1s
        }
        childReady(0);
    }); 

    function run(config) {
        var child = cp.fork('./child.js');
        child.on('exit', function(c) {
            console.log("Child exit with status code", c);
            if (c) {
                setTimeout(reload, 3000);
            }
        });
        try {
            child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);        
        } catch (e) { }
        child.on('message', function(msg, handler) {
            if (msg.reload) reload();
        });
        child.send({init: true, config: config, ipc: ipcadr});
        return child;
    };

    function reload() {
        try { config = loadConfig(); } catch (e) {}
        irc.config = config;
        try { child.kill('SIGKILL'); } 
        catch (e) {}
        child = run(config);
    }

}

child(connection(loadConfig()));

