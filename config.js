
exports.db = 'triplie.db';
exports.server = 'irc.freenode.net';
exports.port = 6667;
exports.modules = ['triplie', 'admin'];
exports.channels = ['#triplie-ng'];

exports.cmdchar = '>';

exports.admins = ['.+@unaffiliated/spion'];

exports.info = {
    nick: 'triplie-ng',
    user: 'triplie',
    name: 'triplie, the next generation'
};

exports.ai = {
    similars: {
        algorithm:'porter',
        language:'en',
        percent: 30
    },
    keywords: {
        treshold: 200,
        limit: 30,
        search: [2, 9]
    },
    generalization: 50,
    creativity: 1,
    ngram: {
        length: 4,
    }
};

