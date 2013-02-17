module.exports = function tokenize(text) {    
    return text.
        replace(/,/g,' , ').
        replace(/;/g,' ; ').
        replace(/\.\s+/g,' . ').
        replace(/\:\s+/g,' : ').
        replace(/!/g, ' ! ').
        replace(/\?/g, ' ? ').
        replace(/\(/g, ' ( ').
        replace(/\)/g, ' ) ').
        trim().
        toLowerCase().
        split(/\s+/);
}

