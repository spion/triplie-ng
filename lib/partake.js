
module.exports = function partake() {

    var self = {},
    counters = [];


    /**
     * Decide if the bot sould partake in the conversation
     * on the channel
     * @param channel {String} the channel
     * @param probability {Number} partake probability < 100
     * @param npm {Number} maximum channel messages per minute or 0 for unlimited
     */
    self.decide = function(channel, probability, mpm) {
        var c;
        if (!probability)
            return false;
        if (!counters[channel])
            c = counters[channel] = {messages: 0};
        else
            c = counters[channel];
        ++c.messages;
        setTimeout(function() { --c.messages; }, 60000);
        var r = Math.random() * 100;
        return  (r < probability && (!mpm || c.messages < mpm));
    };

    return self;
}
