exports.defaults = function defaultOptions(opt) {
    opt = opt || {};     

    opt.similars = opt.similars || { };
    opt.similars.algorithm = opt.similars.algorithm || 'porter';
    opt.similars.percent = opt.similars.percent || 30;
    opt.similars.language = opt.similars.language || 'en';

    opt.keywords = opt.keywords || {};
    opt.keywords.threshold = opt.keywords.threshold || 200;
    opt.keywords.limit = opt.keywords.limit || 20;

    opt.associations = opt.associations || {};
    opt.associations.halflife = opt.associations.halfife || 10;
    opt.associations.limit = opt.associations.limit || 250;


    opt.generalization = opt.generalization || 10;
    opt.creativity = opt.creativity || 75; 

    opt.ngram = opt.ngram || {};

    opt.ngram.depth = opt.ngram.depth || 10;
    opt.ngram.length = opt.ngram.length || 4;

    if (opt.ngram.length < 2) 
        opt.ngram.length = 2;
    if (opt.ngram.length > 5) 
        opt.ngram.length = 5;

    opt.answer = opt.answer || {};
    opt.answer.minwords = opt.answer.minwords || 9;
    opt.answer.minkeys = opt.answer.minkeys || 2;

    opt.partake = opt.partake || {};
    opt.partake.probability = opt.partake.probability || 0;
    opt.partake.traffic     = opt.partake.traffic     || 3;


    opt.context = opt.context || {};

    opt.context.halflife = opt.context.halflife || 150 // 2.5 min
    // context of others is 4 times less important
    opt.context.others   = opt.context.others   || 0.25

    return opt;
};

