module.exports = function tokenize(text) {
    function trimspace(char) { return ' ' + char.trim() + ' '; }
    return text.
        replace(/[.,;:!\?\(\)]/g, trimspace).
        trim().
        toLowerCase().
        split(/\s+/);
};

module.exports.undo = function tokenize_undo(tokens) {
    return (tokens.join(' ') + ' ').replace(/\s+[.,;:!\?\)](\s+|$)/g, function(char) {
        return char.trim() + ' ';
    }).replace(/\s+\(\s+/g, ' (')
     // Replace smiley and 3 dots
    .replace(/:\s\)/g,' :)')
    .replace(/\.\s\.\./g,'...')
    .trim();
};

