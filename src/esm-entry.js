const marked = require('./marked.js');
const Lexer = require('./Lexer.js');
const Parser = require('./Parser.js');
const Tokenizer = require('./Tokenizer.js');
const Renderer = require('./Renderer.js');
const TextRenderer = require('./TextRenderer.js');
const Slugger = require('./Slugger.js');

module.exports = marked;
module.exports.parse = marked;
module.exports.Parser = Parser;
module.exports.parser = Parser.parse;
module.exports.Renderer = Renderer;
module.exports.TextRenderer = TextRenderer;
module.exports.Lexer = Lexer;
module.exports.lexer = Lexer.lex;
module.exports.Tokenizer = Tokenizer;
module.exports.Slugger = Slugger;
