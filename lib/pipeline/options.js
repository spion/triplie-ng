exports.defaults = function defaultOptions(opt) {
    opt = opt || {};     
    opt.similars = opt.similars || { };
    opt.similars.algorithm = opt.similars.algorithm || 'porter';

    opt.similars.percent = opt.similars.percent || 30;
    opt.similars.language = opt.similars.language || 'en';

    opt.keywords = opt.keywords || {};

    opt.keywords.treshold = opt.keywords.treshold || 256;
    opt.keywords.limit = opt.keywords.limit || 20;

    opt.keywords.range = opt.keywords.range || [4,10]

    opt.generalization = opt.generalization || 10;

    opt.creativity = opt.creativity || 101; 

    opt.ngram = opt.ngram || {};

    opt.ngram.length = opt.ngram.length || 4;
    if (opt.ngram.length < 2) 
        opt.ngram.length = 2;
    if (opt.ngram.length > 5) 
        opt.ngram.length = 5;


    return opt;
};

