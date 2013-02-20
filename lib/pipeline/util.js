
exports.parse = function pipeline_parse(descriptor) {
    var desc = descriptor.match(/([a-z]+)(\{([,:0-9a-z"'\[\]]+)\})?/),
        args = desc[3] ? desc[3].split(',').map(function(item) { return item.split(':') }) : [],
        argo = {};
        args.forEach(function(arg) { argo[arg[0]] = arg[1]; });
    return {name: desc[1], args: argo};
};


