var path = require('path'),
    fs = require('fs'),
    yaml = require('js-yaml');

exports.load = function loadConfig(args) {   
    var file = args._[0];
    var filepath = path.resolve(process.cwd(), file || 'undefined');
    if (!fs.existsSync(filepath))
        filepath = path.resolve(process.cwd(), 'config.yaml');
    if (!fs.existsSync(filepath))
        filepath = path.resolve(process.cwd(), 'config.json');
    try {
        var configStr = fs.readFileSync(filepath, { encoding:'utf8' });
        var config = yaml.load(configStr, { filename: filepath });
    } catch (e) {
        console.error(e);
        console.error("Config file invalid or not found.");
        console.error("Try triplie ./config.yaml --init");
        process.exit(1);
    }
    for (var key in args) 
        config[key] = args[key];
    config.__file = filepath;
    return config;

}

exports.save = function saveConfig(file, data) {
    var configStr = yaml.dump(data);
    fs.writeFile(file, configStr);
}
