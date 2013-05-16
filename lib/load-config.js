var path = require('path'),
    fs = require('fs');

module.exports = function loadConfig(args) {   

    var file = args._[0];
    var filepath = path.join(process.cwd(), file || 'config.json');
    if (!fs.existsSync(filepath))
        filepath = path.join(process.cwd(), 'config.json');
    if (!fs.existsSync(filepath))
        filepath = path.join(process.cwd(), 'config.js');

    if (require.cache[filepath]) 
        delete require.cache[filepath]
    
    try {    
        var config = require(filepath);
    } catch (e) {
        console.log("Config file not found. Try triplie ./config.json --init");
        process.exit(1);
    }
    for (var key in args) 
        config[key] = args[key];
    config.__file = filepath;
    return config;

}


