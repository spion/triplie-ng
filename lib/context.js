module.exports = function context(maxsize) {
    var log = {};

    var self = {};

    self.push = function contextPush(who, content, timestamp) {
        if (!log[who]) 
            log[who] = [];
        log[who].unshift({
            text: content,
            timestamp: timestamp
        });
        while (log[who].length > maxsize)
            log[who].pop();
    };

    self.get = function contextGet(who) {
        return log[who] || [];
    }

    return self;
}
