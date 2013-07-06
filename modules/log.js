module.exports = function(irc) {
    irc.on('event', function(e) {
        console.log(e.raw);
    });
};
