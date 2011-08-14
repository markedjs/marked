/**
 * marked - A markdown parser
 * Copyright (c) 2011, Christopher Jeffrey. (MIT Licensed)
 */

/**
 * Block-Level Grammar
 */

var rules = {
  newline: /^\n/,
  block: /^[ ]{4,}[^\n]*(?:\n[ ]{4,}[^\n]*)*/,
  heading: /^ *(#{1,6}) *([^\n#]*) *#*/,
  lheading: /^([^\n]+)\n *(=|-){3,}/,
  hr: /^( ?[\-*_]){3,}/,
  blockquote: /^ *>[^\n]*(?:\n *>[^\n]*)*/,
  list: /^(?:( *)(\*|\+|-|\d+\.)[^\n]+(?:\n(?:\1 )+[^\n]+)*(?:\n+|$)){2,}/g,
  html: /^<([^\/\s>]+)[^\n>]*>[^\n]*(?:\n[^\n]+)*\n?<\/\1>/,
  text: /^[^\n]+/
};

var keys = Object.keys(rules)
  , len = keys.length;

/**
 * Lexer
 */

var lex = function(str) {
  var tokens = []
    , links = {};

  // normalize whitespace
  str = str.replace(/\r\n/g, '\n')
           .replace(/\r/g, '\n');

  str = str.replace(/\t/g, '    ');
  //str = str.replace(/(^|\n) +(\n|$)/g, '$1$2');

  // unfortunately, this is the most 
  // performant method of getting link
  // definitions out of the way.
  str = str.replace(
    /^ {0,3}\[([^\]]+)\]: *([^ ]+)(?: +"([^"]+)")?/gm, 
    function(_, id, href, title) {
    links[id] = {
      href: href,
      title: title
    };
    return '';
  });

  tokens.links = links;

  return lex.token(str, tokens, 0);
};

lex.token = function lex(str, tokens, line) {
 while (str.length) 
  for (var i = 0; i < len; i++) {
    var key = keys[i]
      , rule = rules[key];

    cap = rule.exec(str);
    if (!cap) continue;
    str = str.substring(cap[0].length);

    switch (key) {
      case 'newline':
        line++;
        break;
      case 'hr':
        tokens.push({
          type: 'hr', 
          line: line
        });
        break;
      case 'lheading':
        tokens.push({
          type: 'heading', 
          depth: cap[2] === '=' ? 1 : 2, 
          text: cap[1],
          line: line
        });
        break;
      case 'heading':
        tokens.push({
          type: 'heading', 
          depth: cap[1].length, 
          text: cap[2], 
          line: line
        });
        break;
      case 'block':
        cap = cap[0].replace(/^ {4}/gm, '');
        tokens.push({
          type: 'block', 
          text: cap, 
          line: line
        });
        break;
      case 'list':
        tokens.push({
          type: 'list_start',
          ordered: isFinite(cap[2]), 
          line: line
        });
        // get each top-level 
        // item in the list
        cap = cap[0].match(
          /^( *)(\*|\+|-|\d+\.)[^\n]+(?:\n(?:\1 )+[^\n]+)*/gm
        ); 
        cap.forEach(function(item) {
          // remove the list items sigil 
          // so its seen as the next token
          item = item.replace(/^ *(\*|\+|-|\d+\.) */, '');
          // outdent whatever the 
          // list item contains, hacky
          var len = /\n( +)/.exec(item);
          if (len) {
            len = len[1].length;
            item = item.replace(
              new RegExp('^ {' + len + '}', 'gm'), 
              ''
            );
          }
          tokens.push({
            type: 'list_item_start', 
            line: line
          });

          // recurse
          lex(item, tokens, line);

          tokens.push({
            type: 'list_item_end', 
            line: line
          });
        });
        tokens.push({
          type: 'list_end', 
          line: line
        });
        break;
      case 'html':
      case 'text':
        tokens.push({
          type: key, 
          text: cap[0], 
          line: line
        });
        break;
      case 'blockquote':
        tokens.push({
          type: 'blockquote_start', 
          line: line
        });
        cap = cap[0].replace(/^ *>/gm, ''); 

        // recurse
        lex(cap, tokens, line);

        tokens.push({
          type: 'blockquote_end', 
          line: line
        });
        break;
    }
    break;
  }

  return tokens;
};

/**
 * Inline Processing
 */

var inline = (function() {
  var inline = {
    tag: /^<[^\n>]+>/,
    img: /^!\[([^\]]+)\]\(([^\s\)]+)\s*([^\)]*)\)/,
    link: /^\[([^\]]+)\]\(([^\)]+)\)/,
    reflink: /^\[([^\]]+)\]\[([^\]]+)\]/,
    autolink: /^<([^<>:\/ ]+:(?:\/\/)?[^>\n]+?)|([^<>\n]+?@[^<>\n]+?)>/,
    strong: /^__([\s\S]+?)__|^\*\*([\s\S]+?)\*\*/,
    em: /^_([^_]+)_|^\*([^*]+)\*/,
    escape: /^`([^`]+)`|^``([\s\S]+?)``/
  };

  inline.text = new RegExp(
    '^([\\s\\S]+?)(?='
    + Object.keys(inline).map(function(key) { 
      return inline[key].source.replace(/(^|\|)\^/g, '$1');
    }).join('|')
    + '|$)'
  );

  inline.keys = Object.keys(inline);
  inline.len = inline.keys.length;

  /**
   * Inline Lexer
   */

  inline.lexer = function(str) {
    var rules = inline
      , len = inline.len
      , keys = inline.keys
      , i
      , key
      , rule
      , out = ''
      , links = tokens.links;

    while (str.length) {
      for (i = 0; i < len; i++) {
        key = keys[i];
        rule = rules[key];

        cap = rule.exec(str);
        if (!cap) continue;
        str = str.substring(cap[0].length);

        switch (key) {
          case 'tag':
            out += cap[0];
            break;
          case 'img':
            out += '<img src="' 
              + escape(cap[2])
              + '" alt="' + escape(cap[1])
              + '"' 
              + (cap[3] 
              ? ' title="' 
              + escape(cap[3])
              + '"' 
              : '') 
              + '>';
            break;
          case 'link':
          case 'reflink':
            var link = links[cap[2]] || '';
            out += '<a href="' 
              + escape(link.href || cap[2]) 
              + '"' 
              + (link.title
              ? ' title="' 
              + escape(link.title)
              + '"' 
              : '') 
              + '>'
              + inline.lexer(cap[1])
              + '</a>';
            break;
          case 'autolink':
            var mailto = cap[2]
              , href = cap[1]
              , mail;
            if (mailto) {
              mailto = mangle(mailto);
              mail = mangle('mailto:') + mailto;
            }
            out += '<a href="' 
              + (mail || escape(href)) + '"' 
              + '>' 
              + (mailto || escape(href))
              + '</a>';
            break;
          case 'strong':
            out += '<strong>' 
              + inline.lexer(cap[2] || cap[1]) 
              + '</strong>';
            break;
          case 'em':
            out += '<em>' 
              + inline.lexer(cap[2] || cap[1]) 
              + '</em>';
            break;
          case 'escape':
            out += '<code>' 
              + escape(cap[2] || cap[1]) 
              + '</code>';
            break;
          case 'text':
            out += escape(cap[1]);
            break;
          default:
            break;
        }
        break;
      }
    }

    return out;
  };
  return inline.lexer;
})();

/**
 * Parsing
 */

var tokens
  , token;

var next = function() {
  return token = tokens.pop();
};

var tok = function() {
  switch (token.type) {
    case 'hr': 
      return '<hr>';
    case 'heading': 
      return '<h' + token.depth + '>' 
        + inline(token.text)
        + '</h' + token.depth + '>';
    case 'block': 
      return '<pre><code>' 
        + escape(token.text)
        + '</code></pre>';
    case 'blockquote_start': 
      var body = [];
      while (next().type !== 'blockquote_end') {
        body.push(tok());
      }
      return '<blockquote>' 
        + body.join('') 
        + '</blockquote>';
    case 'list_start':
      var body = []
        , type = token.ordered ? 'ol' : 'ul';
      while (next().type !== 'list_end') {
        body.push(tok());
      }
      return '<' + type + '>' 
        + body.join('') 
        + '</' + type + '>';
    case 'list_item_start': 
      var body = [];
      while (next().type !== 'list_item_end') {
        // TODO incorporate paragraph 
        // list items here
        if (token.type === 'text') {
          body.push(inline(token.text));
        } else {
          body.push(tok());
        }
      }
      return '<li>' 
        + body.join(' ') 
        + '</li>';
    case 'html':
      return inline(token.text);
    case 'text': 
      var body = []
        , last = token.line;
      while (token && token.type === 'text') {
        if (token.line > last) break;
        last = token.line + 1;
        body.push(token.text);
        next();
      }
      if (token) tokens.push(token);
      return '<p>' 
        + inline(body.join(' '))
        + '</p>';
  }
};

var parse = function(src) {
  tokens = src.reverse();

  var out = [];
  while (next()) {
    out.push(tok());
  }

  tokens = null;
  token = null;

  return out.join(' ');
};

/**
 * Helpers
 */

var escape = function(html) {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

var mangle = function(str) {
  var ch
    , i = 0
    , l = str.length
    , out = '';

  for (; i < l; i++) {
    ch = str[i].charCodeAt(0);
    if (Math.random() > .5) {
      ch = 'x' + ch.toString(16);
    }
    out += '&#' + ch + ';';
  }

  return out;
};

/**
 * Expose
 */

exports = function(str) {
  return parse(lex(str));
};

exports.parser = parse;
exports.lexer = lex;

module.exports = exports;
