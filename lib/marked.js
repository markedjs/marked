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
 * Shared 
 */

var line
  , links
  , token
  , tokens;

/**
 * Lexer
 */

var lex = function(str, tokens) {
  if (!tokens) {
    tokens = [];
    line = 0;

    // normalize whitespace
    str = str.replace(/\r\n/g, '\n')
             .replace(/\r/g, '\n');

    str = str.replace(/\t/g, '    ');
    //str = str.replace(/(^|\n) +(\n|$)/g, '$1$2');

    // get the link definitions out of
    // the way as they dont compile to
    // anything, this results in a boost
    // to performance. we could put this 
    // in the "inline" function instead
    // but it confuses things because 
    // it doesn't actually output anything 
    // and it causes a performance hit.
    links = {};
    str = str.replace(
      /^ {0,3}\[([^\]]+)\]: *([^ ]+)(?: +"([^"]+)")?/gm, 
      function(_, id, href, title) {
      links[id] = {
        href: href,
        title: title
      };
      return '';
    });
  }

  var i
    , key
    , rule;

  while (str.length) 
  for (i = 0; i < len; i++) {
    key = keys[i];
    rule = rules[key];

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
        cap = cap[0].replace(/^ +/gm, '');
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
          lex(item, tokens);
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
        lex(cap, tokens);
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

// this is really bad. i should define 
// some lexemes for all of the inline stuff, 
// but this was just easier for the time being.

var inline = function(str) {
  // img
  str = str.replace(
    /!\[([^\]]+)\]\(([^\s\)]+)\s*([^\)]*)\)/g, 
    function(_, alt, src, title) {
    return '<img src="' 
      + src + '" alt="'
      + alt + '"' 
      + (title 
        ? ' title="' + title + '"' 
        : '') 
      + '>';
  });

  // links
  str = str.replace(
    /\[([^\]]+)\]\(([^\)]+)\)/g, 
    '<a href="$2">$1</a>'
  );

  // This is [an example][id] 
  // reference-style link.
  str = str.replace(
    /\[([^\]]+)\]\[([^\]]+)\]/g, 
    function(_, text, id) {
    var link = links[id];
    return '<a href="' 
      + link.href + '"' 
      + (link.title 
        ? ' title="' 
          + link.title + '"'
        : '') 
      + '>' + text + '</a>';
  });

  // for <http://hello.world/> links
  str = str.replace(
    /(?:<|&lt;)([^<>:\/ ]+:(?:\/\/)?[^>\n]+?|[^<>\n]+?(@)[^<>\n]+?)(?:&gt;|>)/g, 
    function(_, href, at) {
    if (at) {
      // according to the markdown "spec"
      // we need to mangle email addresses
      var href = mangle(href)
        , mail = mangle('mailto:') + href;
      return '<a href="' + mail + '">' + href + '</a>';
    }
    return '<a href="' + href + '">' + href + '</a>';
  });

  // strong
  str = str.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  str = str.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // em
  str = str.replace(/_([^_]+)_/g, '<em>$1</em>');
  str = str.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // code
  str = str.replace(/`([^`]+)`/g, function(_, s) {
    return '<code>' + escape(s) + '</code>';
  });

  // br
  str = str.replace(/  $/gm, '<br>');

  return str;
};

/**
 * Parsing
 */

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
  links = null;
  line = null;

  return out.join('\n');
};

/**
 * Helpers
 */

var escape = function(html, d) {
  return html
    .replace(d ? /&(?![^;\n]+;)/ : /&/g, '&amp;')
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