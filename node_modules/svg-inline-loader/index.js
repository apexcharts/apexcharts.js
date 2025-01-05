var simpleHTMLTokenizer = require('simple-html-tokenizer');
var tokenize = simpleHTMLTokenizer.tokenize;
var generate = simpleHTMLTokenizer.generate;
var loaderUtils = require('loader-utils');
var assign = require('object-assign');

var conditions = require('./lib/conditions');
var transformer = require('./lib/transformer');

// TODO: find better parser/tokenizer
var regexSequences = [
    // Remove XML stuffs and comments
    [/<\?xml[\s\S]*?>/gi, ""],
    [/<!doctype[\s\S]*?>/gi, ""],
    [/<!--.*-->/gi, ""],

    // SVG XML -> HTML5
    [/\<([A-Za-z]+)([^\>]*)\/\>/g, "<$1$2></$1>"], // convert self-closing XML SVG nodes to explicitly closed HTML5 SVG nodes
    [/\s+/g, " "],                                 // replace whitespace sequences with a single space
    [/\> \</g, "><"]                               // remove whitespace between tags
];

function getExtractedSVG(svgStr, options) {
    var config;
    // interpolate hashes in classPrefix
    if(!!options) {
        config = assign({}, options);

        if (!!config.classPrefix) {
            const name = config.classPrefix === true ? '__[hash:base64:7]__' : config.classPrefix;
            config.classPrefix = loaderUtils.interpolateName({}, name, { content: svgStr });
        }

        if (!!config.idPrefix) {
            const id_name = config.idPrefix === true ? '__[hash:base64:7]__' : config.idPrefix;
            config.idPrefix = loaderUtils.interpolateName({}, id_name, { content: svgStr });
        }
    }

    // Clean-up XML crusts like comments and doctype, etc.
    var tokens;
    var cleanedUp = regexSequences.reduce(function (prev, regexSequence) {
        return ''.replace.apply(prev, regexSequence);
    }, svgStr).trim();

    // Tokenize and filter attributes using `simpleHTMLTokenizer.tokenize(source)`.
    try {
        tokens = tokenize(cleanedUp);
    } catch (e) {
        // If tokenization has failed, return earlier with cleaned-up string
        console.warn('svg-inline-loader: Tokenization has failed, please check SVG is correct.');
        return cleanedUp;
    }

    // If the token is <svg> start-tag, then remove width and height attributes.
    return generate(transformer.runTransform(tokens, config));
}

function SVGInlineLoader(content) {
    this.cacheable && this.cacheable();
    this.value = content;
    // Configuration
    var options = loaderUtils.getOptions(this);

    return "module.exports = " + JSON.stringify(getExtractedSVG(content, options));
}

SVGInlineLoader.getExtractedSVG = getExtractedSVG;
SVGInlineLoader.conditions = conditions;
SVGInlineLoader.regexSequences = regexSequences;

module.exports = SVGInlineLoader;
