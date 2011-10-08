/**
 * marked - A markdown parser
 * Copyright (c) 2011, Christopher Jeffrey. (MIT Licensed)
 */

;(function() {

/**
 * Block-Level Grammar
 */

var block = {
  newline: /^\n+/,
  block: /^ {4,}[^\n]*(?:\n {4,}[^\n]*|\n)*(?=\n| *$)/,
  hr: /^( *[\-*_]){3,} *\n/,
  heading: /^ *(#{1,6}) *([^\0]+?) *#* *\n+/,
  lheading: /^([^\n]+)\n *(=|-){3,}/,
  blockquote: /^ *>[^\n]*(?:\n *>[^\n]*)*/,
  list: /^( *)([*+-]|\d+\.) [^\0]+?(?:\n{2,}(?! )|\s*$)(?!\1\2|\1\d+\.)/,
  html: /^ *(?:<!--[^\0]*?-->|<(\w+)[^\0]+?<\/\1>|<\w+[^>]*>) *(?:\n{2,}|\s*$)/,
  text: /^[^\n]+/
};

block.keys = [
  'newline',
  'block',
  'heading',
  'lheading',
  'hr',
  'blockquote',
  'list',
  'html',
  'text'
];

/**
 * Lexer
 */

block.lexer = function(str) {
  var tokens = []
    , links = {};

  str = str.replace(/\r\n|\r/g, '\n')
           .replace(/\t/g, '    ');

  str = str.replace(
    /^ {0,3}\[([^\]]+)\]: *([^ ]+)(?: +"([^\n]+)")? *$/gm,
    function(__, id, href, title) {
      links[id] = {
        href: href,
        title: title
      };
      return '';
    }
  );

  tokens.links = links;

  return block.token(str, tokens);
};

block.token = function(str, tokens) {
  str = str.replace(/^ +$/gm, '');

  var rules = block
    , keys = block.keys
    , len = keys.length
    , key
    , cap
    , loose;

  var scan = function() {
    if (!str) return;
    for (var i = 0; i < len; i++) {
      key = keys[i];
      if (cap = rules[key].exec(str)) {
        str = str.substring(cap[0].length);
        return true;
      }
    }
  };

  while (scan()) {
    switch (key) {
      case 'newline':
        if (cap[0].length > 1) {
          tokens.push({
            type: 'space'
          });
        }
        break;
      case 'hr':
        tokens.push({
          type: 'hr'
        });
        break;
      case 'lheading':
        tokens.push({
          type: 'heading',
          depth: cap[2] === '=' ? 1 : 2,
          text: cap[1]
        });
        break;
      case 'heading':
        tokens.push({
          type: 'heading',
          depth: cap[1].length,
          text: cap[2]
        });
        break;
      case 'block':
        cap = cap[0].replace(/^ {4}/gm, '');
        tokens.push({
          type: 'block',
          text: cap
        });
        break;
      case 'list':
        tokens.push({
          type: 'list_start',
          ordered: isFinite(cap[2])
        });
        loose = /\n *\n *(?:[*+-]|\d+\.)/.test(cap[0]);
        // get each top-level item
        cap = cap[0].match(
          /^( *)([*+-]|\d+\.)[^\n]*(?:\n(?!\1(?:\2|\d+\.))[^\n]*)*/gm
        );
        each(cap, function(item) {
          // remove the list items sigil
          // so its seen as the next token
          item = item.replace(/^ *([*+-]|\d+\.) */, '');
          // outdent whatever the
          // list item contains, hacky
          var space = /\n( +)/.exec(item);
          if (space) {
            space = new RegExp('^' + space[1], 'gm');
            item = item.replace(space, '');
          }
          tokens.push({
            type: loose
              ? 'loose_item_start'
              : 'list_item_start'
          });
          block.token(item, tokens);
          tokens.push({
            type: 'list_item_end'
          });
        });
        tokens.push({
          type: 'list_end'
        });
        break;
      case 'html':
      case 'text':
        tokens.push({
          type: key,
          text: cap[0]
        });
        break;
      case 'blockquote':
        tokens.push({
          type: 'blockquote_start'
        });
        cap = cap[0].replace(/^ *>/gm, '');
        block.token(cap, tokens);
        tokens.push({
          type: 'blockquote_end'
        });
        break;
    }
  }

  return tokens;
};

/**
 * Inline Processing
 */

var inline = {
  escape: /^\\([\\`*{}\[\]()#+\-.!_])/,
  autolink: /^<([^ >]+(@|:\/)[^ >]+)>/,
  tag: /^<!--[^\0]*?-->|^<\/?\w+[^>]*>/,
  link: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]\s*\(([^\)]*)\)/,
  reflink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]\s*\[([^\]]*)\]/,
  nolink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,
  strong: /^__([^\0]+?)__(?!_)|^\*\*([^\0]+?)\*\*(?!\*)/,
  em: /^_([^_]+)_|^\*([^*]+)\*/,
  code: /^`([^`]+)`|^``([^\0]+?)``/,
  br: /^ {2,}\n(?!\s*$)/,
  text: /^/
};

inline.keys = [
  'escape',
  'autolink',
  'tag',
  'link',
  'reflink',
  'nolink',
  'strong',
  'em',
  'code',
  'br',
  'text'
];

// hacky, but performant
inline.text = (function() {
  var body = [];

  (function push(rule) {
    rule = inline[rule].source;
    body.push(rule.replace(/(^|[^\[])\^/g, '$1'));
    return push;
  })
  ('escape')
  ('tag')
  ('nolink')
  ('strong')
  ('em')
  ('code')
  ('br');

  return new
    RegExp('^[^\\0]+?(?=' + body.join('|') + '|$)');
})();

/**
 * Inline Lexer
 */

inline.lexer = function(str) {
  var out = ''
    , links = tokens.links
    , link
    , text
    , href;

  var rules = inline
    , keys = inline.keys
    , len = keys.length
    , key
    , cap;

  var scan = function() {
    if (!str) return;
    for (var i = 0; i < len; i++) {
      key = keys[i];
      if (cap = rules[key].exec(str)) {
        str = str.substring(cap[0].length);
        return true;
      }
    }
  };

  while (scan()) {
    switch (key) {
      case 'escape':
        out += cap[1];
        break;
      case 'tag':
        out += cap[0];
        break;
      case 'link':
      case 'reflink':
      case 'nolink':
        if (key !== 'link') {
          link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
          link = links[link];
          if (!link) {
            out += cap[0][0];
            str = cap[0].substring(1) + str;
            break;
          }
        } else {
          text = /^\s*<?([^\s]*?)>?(?:\s+"([^\n]+)")?\s*$/.exec(cap[2]);
          link = {
            href: text[1],
            title: text[2]
          };
        }
        if (cap[0][0] !== '!') {
          out += '<a href="'
            + escape(link.href)
            + '"'
            + (link.title
            ? ' title="'
            + escape(link.title)
            + '"'
            : '')
            + '>'
            + inline.lexer(cap[1])
            + '</a>';
        } else {
          out += '<img src="'
            + escape(link.href)
            + '" alt="'
            + escape(cap[1])
            + '"'
            + (link.title
            ? ' title="'
            + escape(link.title)
            + '"'
            : '')
            + '>';
        }
        break;
      case 'autolink':
        if (cap[2] === '@') {
          text = cap[1][6] === ':'
            ? mangle(cap[1].substring(7))
            : mangle(cap[1]);
          href = mangle('mailto:') + text;
        } else {
          text = escape(cap[1]);
          href = text;
        }
        out += '<a href="' + href + '">'
          + text
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
      case 'code':
        out += '<code>'
          + escape(cap[2] || cap[1])
          + '</code>';
        break;
      case 'br':
        out += '<br>';
        break;
      case 'text':
        out += escape(cap[0]);
        break;
    }
  }

  return out;
};

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
    case 'space':
      return '';
    case 'hr':
      return '<hr>';
    case 'heading':
      return '<h' + token.depth + '>'
        + inline.lexer(token.text)
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
      var type = token.ordered ? 'ol' : 'ul'
        , body = [];
      while (next().type !== 'list_end') {
        body.push(tok());
      }
      return '<' + type + '>'
        + body.join('')
        + '</' + type + '>';
    case 'list_item_start':
      var body = [];
      while (next().type !== 'list_item_end') {
        body.push(token.type === 'text'
          ? text()
          : tok());
      }
      return '<li>'
        + body.join(' ')
        + '</li>';
    case 'loose_item_start':
      var body = [];
      while (next().type !== 'list_item_end') {
        body.push(tok());
      }
      return '<li>'
        + body.join(' ')
        + '</li>';
    case 'html':
      return inline.lexer(token.text);
    case 'text':
      return '<p>' + text() + '</p>';
 }
};

var text = function() {
  var body = [ token.text ]
    , top;

  while ((top = tokens[tokens.length-1])
         && top.type === 'text') {
    body.push(next().text);
  }

  return inline.lexer(body.join('\n'));
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
  var out = ''
    , ch
    , i = 0
    , l = str.length;

  for (; i < l; i++) {
    ch = str.charCodeAt(i);
    if (Math.random() > 0.5) {
      ch = 'x' + ch.toString(16);
    }
    out += '&#' + ch + ';';
  }

  return out;
};

var each = function(obj, func) {
  var i = 0, l = obj.length;
  for (; i < l; i++) func(obj[i]);
};

/**
 * Expose
 */

var marked = function(str) {
  return parse(block.lexer(str));
};

marked.parser = parse;
marked.lexer = block.lexer;

if (typeof module !== 'undefined') {
  module.exports = marked;
} else {
  this.marked = marked;
}

}).call(this);
