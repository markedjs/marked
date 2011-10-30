/**
 * marked - A markdown parser
 * Copyright (c) 2011, Christopher Jeffrey. (MIT Licensed)
 */

;(function() {

/**
 * Options
 */
var opt = {
  ignoreHtml: false
};

/**
 * Block-Level Grammar
 */

var block = {
  newline: /^\n+/,
  code: /^ {4,}[^\n]*(?:\n {4,}[^\n]*|\n)*(?=\n| *$)/,
  hr: /^( *[\-*_]){3,} *\n/,
  heading: /^ *(#{1,6}) *([^\0]+?) *#* *\n+/,
  lheading: /^([^\n]+)\n *(=|-){3,}/,
  blockquote: /^ *>[^\n]*(?:\n *>[^\n]*)*/,
  list: /^( *)([*+-]|\d+\.) [^\0]+?(?:\n{2,}(?! )|\s*$)(?!\1\2|\1\d+\.)/,
  html: /^ *(?:<!--[^\0]*?-->|<(\w+)[^\0]+?<\/\1>|<\w+[^>]*>) *(?:\n{2,}|\s*$)/,
  text: /^[^\n]+/
};

/**
 * Block Lexer
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
  var str = str.replace(/^ +$/gm, '')
    , loose
    , cap
    , item
    , space
    , i
    , l;

  while (str) {
    // newline
    if (cap = block.newline.exec(str)) {
      str = str.substring(cap[0].length);
      if (cap[0].length > 1) {
        tokens.push({
          type: 'space'
        });
      }
      continue;
    }

    // code
    if (cap = block.code.exec(str)) {
      str = str.substring(cap[0].length);
      cap = cap[0].replace(/^ {4}/gm, '');
      tokens.push({
        type: 'code',
        text: cap
      });
      continue;
    }

    // heading
    if (cap = block.heading.exec(str)) {
      str = str.substring(cap[0].length);
      tokens.push({
        type: 'heading',
        depth: cap[1].length,
        text: cap[2]
      });
      continue;
    }

    // lheading
    if (cap = block.lheading.exec(str)) {
      str = str.substring(cap[0].length);
      tokens.push({
        type: 'heading',
        depth: cap[2] === '=' ? 1 : 2,
        text: cap[1]
      });
      continue;
    }

    // hr
    if (cap = block.hr.exec(str)) {
      str = str.substring(cap[0].length);
      tokens.push({
        type: 'hr'
      });
      continue;
    }

    // blockquote
    if (cap = block.blockquote.exec(str)) {
      str = str.substring(cap[0].length);
      tokens.push({
        type: 'blockquote_start'
      });
      cap = cap[0].replace(/^ *>/gm, '');
      block.token(cap, tokens);
      tokens.push({
        type: 'blockquote_end'
      });
      continue;
    }

    // list
    if (cap = block.list.exec(str)) {
      str = str.substring(cap[0].length);

      tokens.push({
        type: 'list_start',
        ordered: isFinite(cap[2])
      });

      loose = /\n *\n *(?:[*+-]|\d+\.)/.test(cap[0]);

      // get each top-level item
      cap = cap[0].match(
        /^( *)([*+-]|\d+\.)[^\n]*(?:\n(?!\1(?:\2|\d+\.))[^\n]*)*/gm
      );

      i = 0;
      l = cap.length;

      for (; i < l; i++) {
        // remove the list items sigil
        // so its seen as the next token
        item = cap[i].replace(/^ *([*+-]|\d+\.) */, '');
        // outdent whatever the
        // list item contains, hacky
        space = /\n( +)/.exec(item);
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
      }

      tokens.push({
        type: 'list_end'
      });

      continue;
    }

    // html
    if (!opt.ignoreHtml && (cap = block.html.exec(str))) {
      str = str.substring(cap[0].length);
      tokens.push({
        type: 'html',
        text: cap[0]
      });
      continue;
    }

    // text
    if (cap = block.text.exec(str)) {
      str = str.substring(cap[0].length);
      tokens.push({
        type: 'text',
        text: cap[0]
      });
      continue;
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
    , href
    , cap;

  while (str) {
    // escape
    if (cap = inline.escape.exec(str)) {
      str = str.substring(cap[0].length);
      out += cap[1];
      continue;
    }

    // autolink
    if (cap = inline.autolink.exec(str)) {
      str = str.substring(cap[0].length);
      if (cap[2] === '@') {
        text = cap[1][6] === ':'
          ? mangle(cap[1].substring(7))
          : mangle(cap[1]);
        href = mangle('mailto:') + text;
      } else {
        text = escape(cap[1]);
        href = text;
      }
      out += '<a href="'
        + href
        + '">'
        + text
        + '</a>';
      continue;
    }

    // tag
    if (!opt.ignoreHtml && (cap = inline.tag.exec(str))) {
      str = str.substring(cap[0].length);
      out += cap[0];
      continue;
    }

    // link
    if (cap = inline.link.exec(str)) {
      str = str.substring(cap[0].length);
      text = /^\s*<?([^\s]*?)>?(?:\s+"([^\n]+)")?\s*$/.exec(cap[2]);
      link = {
        href: text[1],
        title: text[2]
      };
      out += mlink(cap, link);
      continue;
    }

    // reflink, nolink
    if ((cap = inline.reflink.exec(str))
        || (cap = inline.nolink.exec(str))) {
      str = str.substring(cap[0].length);
      link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
      link = links[link];
      if (!link) {
        out += cap[0][0];
        str = cap[0].substring(1) + str;
        continue;
      }
      out += mlink(cap, link);
      continue;
    }

    // strong
    if (cap = inline.strong.exec(str)) {
      str = str.substring(cap[0].length);
      out += '<strong>'
        + inline.lexer(cap[2] || cap[1])
        + '</strong>';
      continue;
    }

    // em
    if (cap = inline.em.exec(str)) {
      str = str.substring(cap[0].length);
      out += '<em>'
        + inline.lexer(cap[2] || cap[1])
        + '</em>';
      continue;
    }

    // code
    if (cap = inline.code.exec(str)) {
      str = str.substring(cap[0].length);
      out += '<code>'
        + escape(cap[2] || cap[1])
        + '</code>';
      continue;
    }

    // br
    if (cap = inline.br.exec(str)) {
      str = str.substring(cap[0].length);
      out += '<br>';
      continue;
    }

    // text
    if (cap = inline.text.exec(str)) {
      str = str.substring(cap[0].length);
      out += escape(cap[0]);
      continue;
    }
  }

  return out;
};

var mlink = function(cap, link) {
  if (cap[0][0] !== '!') {
    return '<a href="'
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
    return '<img src="'
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
    case 'space': {
      return '';
    }
    case 'hr': {
      return '<hr>';
    }
    case 'heading': {
      return '<h'
        + token.depth
        + '>'
        + inline.lexer(token.text)
        + '</h'
        + token.depth
        + '>';
    }
    case 'code': {
      return '<pre><code>'
        + escape(token.text)
        + '</code></pre>';
    }
    case 'blockquote_start': {
      var body = [];

      while (next().type !== 'blockquote_end') {
        body.push(tok());
      }

      return '<blockquote>'
        + body.join('')
        + '</blockquote>';
    }
    case 'list_start': {
      var type = token.ordered ? 'ol' : 'ul'
        , body = [];

      while (next().type !== 'list_end') {
        body.push(tok());
      }

      return '<'
        + type
        + '>'
        + body.join('')
        + '</'
        + type
        + '>';
    }
    case 'list_item_start': {
      var body = [];

      while (next().type !== 'list_item_end') {
        body.push(token.type === 'text'
          ? text()
          : tok());
      }

      return '<li>'
        + body.join(' ')
        + '</li>';
    }
    case 'loose_item_start': {
      var body = [];

      while (next().type !== 'list_item_end') {
        body.push(tok());
      }

      return '<li>'
        + body.join(' ')
        + '</li>';
    }
    case 'html': {
      return inline.lexer(token.text);
    }
    case 'text': {
      return '<p>'
        + text()
        + '</p>';
    }
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

/**
 * Expose
 */

var marked = function(str, options) {
  if (typeof options === 'object')
    for (var key in options)
      opt[key] = options[key];

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
