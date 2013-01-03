/**
 * marked - A markdown parser (https://github.com/chjj/marked)
 * Copyright (c) 2011-2012, Christopher Jeffrey. (MIT Licensed)
 */

;(function() {

/**
 * Block-Level Grammar
 */

var block = {
  newline: /^\n+/,
  code: /^( {4}[^\n]+\n*)+/,
  fences: noop,
  table: noop,
  nptable: noop,
  hr: /^( *[-*_]){3,} *(?:\n+|$)/,
  heading: /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,
  lheading: /^([^\n]+)\n *(=|-){3,} *\n*/,
  blockquote: /^( *>[^\n]+(\n[^\n]+)*\n*)+/,
  list: /^( *)(bull) [\s\S]+?(?:hr|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
  html: /^ *(?:comment|closed|closing) *(?:\n{2,}|\s*$)/,
  def: /^ *\[([^\]]+)\]: *([^\s]+)(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
  paragraph: /^([^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+\n*/,
  text: /^[^\n]+/
};

block.bullet = /(?:[*+-]|\d+\.)/;
block.item = /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;
block.item = replace(block.item, 'gm')
  (/bull/g, block.bullet)
  ();

block.list = replace(block.list)
  (/bull/g, block.bullet)
  ('hr', /\n+(?=(?: *[-*_]){3,} *(?:\n+|$))/)
  ();

block._tag = '(?!(?:'
  + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code'
  + '|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo'
  + '|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|@)\\b';

block.html = replace(block.html)
  ('comment', /<!--[\s\S]*?-->/)
  ('closed', /<(tag)[\s\S]+?<\/\1>/)
  ('closing', /<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)
  (/tag/g, block._tag)
  ();

block.paragraph = replace(block.paragraph)
  ('hr', block.hr)
  ('heading', block.heading)
  ('lheading', block.lheading)
  ('blockquote', block.blockquote)
  ('tag', '<' + block._tag)
  ('def', block.def)
  ();

block.normal = {
  fences: block.fences,
  paragraph: block.paragraph,
  table: block.table,
  nptable: block.nptable
};

block.gfm = {
  fences: /^ *(`{3,}|~{3,}) *(\w+)? *\n([\s\S]+?)\s*\1 *(?:\n+|$)/,
  paragraph: /^/,
  table: /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*\n)*)\n*/,
  nptable: /^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*\n)*)\n*/
};

block.gfm.paragraph = replace(block.paragraph)
  ('(?!', '(?!'
    + block.gfm.fences.source.replace('\\1', '\\2')
    + '|' + block.gfm.table.source
    + '|' + block.gfm.nptable.source
    + '|')
  ();

/**
 * Block Lexer
 */

function Lexer(options) {
  this.tokens = [];
  this.tokens.links = {};
  this.options = options || marked.defaults;

  if (this.options.gfm) {
    block.fences = block.gfm.fences;
    block.paragraph = block.gfm.paragraph;
  } else {
    block.fences = block.normal.fences;
    block.paragraph = block.normal.paragraph;
  }

  if (this.options.gfm && this.options.tables) {
    block.table = block.gfm.table;
    block.nptable = block.gfm.nptable;
  } else {
    block.table = block.normal.table;
    block.nptable = block.normal.nptable;
  }
}

Lexer.rules = block;

Lexer.lex = function(src, options) {
  var lexer = new Lexer(options);
  return lexer.lex(src);
};

Lexer.prototype.lex = function(src) {
  src = src
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, '    ');

  return this.token(src, true);
};

Lexer.prototype.token = function(src, top) {
  var src = src.replace(/^ +$/gm, '')
    , next
    , loose
    , cap
    , item
    , space
    , i
    , l;

  while (src) {
    // newline
    if (cap = block.newline.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[0].length > 1) {
        this.tokens.push({
          type: 'space'
        });
      }
    }

    // code
    if (cap = block.code.exec(src)) {
      src = src.substring(cap[0].length);
      cap = cap[0].replace(/^ {4}/gm, '');
      this.tokens.push({
        type: 'code',
        text: !this.options.pedantic
          ? cap.replace(/\n+$/, '')
          : cap
      });
      continue;
    }

    // fences (gfm)
    if (cap = block.fences.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'code',
        lang: cap[2],
        text: cap[3]
      });
      continue;
    }

    // heading
    if (cap = block.heading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[1].length,
        text: cap[2]
      });
      continue;
    }

    // table no leading pipe (gfm)
    if (top && (cap = block.nptable.exec(src))) {
      src = src.substring(cap[0].length);

      item = {
        type: 'table',
        header: cap[1].replace(/(^ *| *\| *$)/g, '').split(/ *\| */),
        align: cap[2].replace(/(^ *|\| *$)/g, '').split(/ *\| */),
        cells: cap[3].replace(/\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i].split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // lheading
    if (cap = block.lheading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[2] === '=' ? 1 : 2,
        text: cap[1]
      });
      continue;
    }

    // hr
    if (cap = block.hr.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'hr'
      });
      continue;
    }

    // blockquote
    if (cap = block.blockquote.exec(src)) {
      src = src.substring(cap[0].length);

      this.tokens.push({
        type: 'blockquote_start'
      });

      cap = cap[0].replace(/^ *> ?/gm, '');

      // Pass `top` to keep the current
      // "toplevel" state. This is exactly
      // how markdown.pl works.
      this.token(cap, top);

      this.tokens.push({
        type: 'blockquote_end'
      });

      continue;
    }

    // list
    if (cap = block.list.exec(src)) {
      src = src.substring(cap[0].length);

      this.tokens.push({
        type: 'list_start',
        ordered: isFinite(cap[2])
      });

      // Get each top-level item.
      cap = cap[0].match(block.item);

      next = false;
      l = cap.length;
      i = 0;

      for (; i < l; i++) {
        item = cap[i];

        // Remove the list item's bullet
        // so it is seen as the next token.
        space = item.length;
        item = item.replace(/^ *([*+-]|\d+\.) +/, '');

        // Outdent whatever the
        // list item contains. Hacky.
        if (~item.indexOf('\n ')) {
          space -= item.length;
          item = !this.options.pedantic
            ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
            : item.replace(/^ {1,4}/gm, '');
        }

        // Determine whether item is loose or not.
        // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
        // for discount behavior.
        loose = next || /\n\n(?!\s*$)/.test(item);
        if (i !== l - 1) {
          next = item[item.length-1] === '\n';
          if (!loose) loose = next;
        }

        this.tokens.push({
          type: loose
            ? 'loose_item_start'
            : 'list_item_start'
        });

        // Recurse.
        this.token(item);

        this.tokens.push({
          type: 'list_item_end'
        });
      }

      this.tokens.push({
        type: 'list_end'
      });

      continue;
    }

    // html
    if (cap = block.html.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: this.options.sanitize
          ? 'paragraph'
          : 'html',
        pre: cap[1] === 'pre',
        text: cap[0]
      });
      continue;
    }

    // def
    if (top && (cap = block.def.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.links[cap[1].toLowerCase()] = {
        href: cap[2],
        title: cap[3]
      };
      continue;
    }

    // table (gfm)
    if (top && (cap = block.table.exec(src))) {
      src = src.substring(cap[0].length);

      item = {
        type: 'table',
        header: cap[1].replace(/(^ *| *\| *$)/g, '').split(/ *\| */),
        align: cap[2].replace(/(^ *|\| *$)/g, '').split(/ *\| */),
        cells: cap[3].replace(/( *\| *)?\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i]
          .replace(/(^ *\| *| *\| *$)/g, '')
          .split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // top-level paragraph
    if (top && (cap = block.paragraph.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'paragraph',
        text: cap[0]
      });
      continue;
    }

    // text
    if (cap = block.text.exec(src)) {
      // Top-level should never reach here.
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'text',
        text: cap[0]
      });
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return this.tokens;
};

/**
 * Inline Processing
 */

var inline = {
  escape: /^\\([\\`*{}\[\]()#+\-.!_>|])/,
  autolink: /^<([^ >]+(@|:\/)[^ >]+)>/,
  url: noop,
  tag: /^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,
  link: /^!?\[(inside)\]\(href\)/,
  reflink: /^!?\[(inside)\]\s*\[([^\]]*)\]/,
  nolink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,
  strong: /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,
  em: /^\b_((?:__|[\s\S])+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
  code: /^(`+)([\s\S]*?[^`])\1(?!`)/,
  br: /^ {2,}\n(?!\s*$)/,
  text: /^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/
};

inline._linkInside = /(?:\[[^\]]*\]|[^\]]|\](?=[^\[]*\]))*/;
inline._linkHref = /\s*<?([^\s]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/;

inline.link = replace(inline.link)
  ('inside', inline._linkInside)
  ('href', inline._linkHref)
  ();

inline.reflink = replace(inline.reflink)
  ('inside', inline._linkInside)
  ();

inline.normal = {
  url: inline.url,
  strong: inline.strong,
  em: inline.em,
  br: inline.br,
  text: inline.text
};

inline.pedantic = {
  strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
  em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/
};

inline.gfm = {
  url: /^(https?:\/\/[^\s]+[^.,:;"')\]\s])/,
  text: /^[\s\S]+?(?=[\\<!\[_*`]|https?:\/\/| {2,}\n|$)/
};

inline.gfm.breaks = {
  br: replace(inline.br)('{2,}', '*')(),
  text: replace(inline.gfm.text)('{2,}', '*')()
};

/**
 * Inline Lexer & Compiler
 */

function InlineLexer(links, options) {
  this.options = options || marked.defaults;
  this.links = links || {};

  if (this.options.gfm) {
    inline.text = inline.gfm.text;
    inline.url = inline.gfm.url;
  } else {
    inline.text = inline.normal.text;
    inline.url = inline.normal.url;
  }

  if (this.options.gfm && this.options.breaks) {
    inline.br = inline.gfm.breaks.br;
    inline.text = inline.gfm.breaks.text;
  } else {
    inline.br = inline.normal.br;
    if (this.options.gfm) {
      inline.text = inline.gfm.text;
    } else {
      inline.text = inline.normal.text;
    }
  }

  if (this.options.pedantic) {
    inline.em = inline.pedantic.em;
    inline.strong = inline.pedantic.strong;
  } else {
    inline.em = inline.normal.em;
    inline.strong = inline.normal.strong;
  }
}

InlineLexer.rules = inline;

InlineLexer.prototype.output = function(src) {
  var out = ''
    , links = this.links
    , link
    , text
    , href
    , cap;

  while (src) {
    // escape
    if (cap = inline.escape.exec(src)) {
      src = src.substring(cap[0].length);
      out += cap[1];
      continue;
    }

    // autolink
    if (cap = inline.autolink.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[2] === '@') {
        text = cap[1][6] === ':'
          ? this.mangle(cap[1].substring(7))
          : this.mangle(cap[1]);
        href = this.mangle('mailto:') + text;
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

    // url (gfm)
    if (cap = inline.url.exec(src)) {
      src = src.substring(cap[0].length);
      text = escape(cap[1]);
      href = text;
      out += '<a href="'
        + href
        + '">'
        + text
        + '</a>';
      continue;
    }

    // tag
    if (cap = inline.tag.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.options.sanitize
        ? escape(cap[0])
        : cap[0];
      continue;
    }

    // link
    if (cap = inline.link.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.outputLink(cap, {
        href: cap[2],
        title: cap[3]
      });
      continue;
    }

    // reflink, nolink
    if ((cap = inline.reflink.exec(src))
        || (cap = inline.nolink.exec(src))) {
      src = src.substring(cap[0].length);
      link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
      link = links[link.toLowerCase()];
      if (!link || !link.href) {
        out += cap[0][0];
        src = cap[0].substring(1) + src;
        continue;
      }
      out += this.outputLink(cap, link);
      continue;
    }

    // strong
    if (cap = inline.strong.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<strong>'
        + this.output(cap[2] || cap[1])
        + '</strong>';
      continue;
    }

    // em
    if (cap = inline.em.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<em>'
        + this.output(cap[2] || cap[1])
        + '</em>';
      continue;
    }

    // code
    if (cap = inline.code.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<code>'
        + escape(cap[2], true)
        + '</code>';
      continue;
    }

    // br
    if (cap = inline.br.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<br>';
      continue;
    }

    // text
    if (cap = inline.text.exec(src)) {
      src = src.substring(cap[0].length);
      out += escape(cap[0]);
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return out;
};

InlineLexer.output = function(src, links, opt) {
  var inline = new InlineLexer(links, opt);
  return inline.output(src);
};

InlineLexer.prototype.outputLink = function(cap, link) {
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
      + this.output(cap[1])
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

InlineLexer.prototype.mangle = function(text) {
  var out = ''
    , l = text.length
    , i = 0
    , ch;

  for (; i < l; i++) {
    ch = text.charCodeAt(i);
    if (Math.random() > 0.5) {
      ch = 'x' + ch.toString(16);
    }
    out += '&#' + ch + ';';
  }

  return out;
};

/**
 * Parsing & Compiling
 */

function Parser(options) {
  this.tokens = [];
  this.token = null;
  this.options = options || marked.defaults;
}

Parser.parse = function(src, options) {
  var parser = new Parser(options);
  return parser.parse(src);
};

Parser.prototype.parse = function(src) {
  this.inline = new InlineLexer(src.links, this.options);
  this.tokens = src.reverse();

  var out = '';
  while (this.next()) {
    out += this.tok();
  }

  return out;
};

Parser.prototype.next = function() {
  return this.token = this.tokens.pop();
};

Parser.prototype.peek = function() {
  return this.tokens[this.tokens.length-1] || 0;
};

Parser.prototype.parseText = function() {
  var body = this.token.text;

  while (this.peek().type === 'text') {
    body += '\n' + this.next().text;
  }

  return this.inline.output(body);
};

Parser.prototype.tok = function() {
  switch (this.token.type) {
    case 'space': {
      return '';
    }
    case 'hr': {
      return '<hr>\n';
    }
    case 'heading': {
      return '<h'
        + this.token.depth
        + '>'
        + this.inline.output(this.token.text)
        + '</h'
        + this.token.depth
        + '>\n';
    }
    case 'code': {
      if (this.options.highlight) {
        this.token.code = this.options.highlight(this.token.text, this.token.lang);
        if (this.token.code != null && this.token.code !== this.token.text) {
          this.token.escaped = true;
          this.token.text = this.token.code;
        }
      }

      if (!this.token.escaped) {
        this.token.text = escape(this.token.text, true);
      }

      return '<pre><code'
        + (this.token.lang
        ? ' class="lang-'
        + this.token.lang
        + '"'
        : '')
        + '>'
        + this.token.text
        + '</code></pre>\n';
    }
    case 'table': {
      var thead
        , heading
        , i
        , tbody
        , row
        , cell
        , j;

      // header
      thead = '<thead>\n<tr>\n';
      for (i = 0; i < this.token.header.length; i++) {
        heading = this.inline.output(this.token.header[i]);
        thead += this.token.align[i]
          ? '<th align="' + this.token.align[i] + '">' + heading + '</th>\n'
          : '<th>' + heading + '</th>\n';
      }
      thead += '</tr>\n</thead>\n';

      // body
      tbody = '<tbody>\n'
      for (i = 0; i < this.token.cells.length; i++) {
        row = this.token.cells[i];
        tbody += '<tr>\n';
        for (j = 0; j < row.length; j++) {
          cell = this.inline.output(row[j]);
          tbody += this.token.align[j]
            ? '<td align="' + this.token.align[j] + '">' + cell + '</td>\n'
            : '<td>' + cell + '</td>\n';
        }
        tbody += '</tr>\n';
      }
      tbody += '</tbody>\n';

      return '<table>\n'
        + thead
        + tbody
        + '</table>\n'
    }
    case 'blockquote_start': {
      var body = '';

      while (this.next().type !== 'blockquote_end') {
        body += this.tok();
      }

      return '<blockquote>\n'
        + body
        + '</blockquote>\n';
    }
    case 'list_start': {
      var type = this.token.ordered ? 'ol' : 'ul'
        , body = '';

      while (this.next().type !== 'list_end') {
        body += this.tok();
      }

      return '<'
        + type
        + '>\n'
        + body
        + '</'
        + type
        + '>\n';
    }
    case 'list_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.token.type === 'text'
          ? this.parseText()
          : this.tok();
      }

      return '<li>'
        + body
        + '</li>\n';
    }
    case 'loose_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.tok();
      }

      return '<li>'
        + body
        + '</li>\n';
    }
    case 'html': {
      return !this.token.pre && !this.options.pedantic
        ? this.inline.output(this.token.text)
        : this.token.text;
    }
    case 'paragraph': {
      return '<p>'
        + this.inline.output(this.token.text)
        + '</p>\n';
    }
    case 'text': {
      return '<p>'
        + this.parseText()
        + '</p>\n';
    }
  }
};

/**
 * Helpers
 */

function escape(html, encode) {
  return html
    .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function replace(regex, opt) {
  regex = regex.source;
  opt = opt || '';
  return function self(name, val) {
    if (!name) return new RegExp(regex, opt);
    val = val.source || val;
    val = val.replace(/(^|[^\[])\^/g, '$1');
    regex = regex.replace(name, val);
    return self;
  };
}

function noop() {}
noop.exec = noop;

/**
 * Marked
 */

function marked(src, opt) {
  try {
    return Parser.parse(Lexer.lex(src, opt), opt);
  } catch (e) {
    e.message += '\nPlease report this to https://github.com/chjj/marked.';
    if ((opt || marked.defaults).silent) {
      return 'An error occured:\n' + e.message;
    }
    throw e;
  }
}

/**
 * Options
 */

marked.options =
marked.setOptions = function(opt) {
  marked.defaults = opt;
  return marked;
};

marked.defaults = {
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  silent: false,
  highlight: null
};

/**
 * Expose
 */

marked.Parser = Parser;
marked.parser = function(src, opt) {
  return Parser.parse(src, opt);
};

marked.Lexer = Lexer;
marked.lexer = function(src, opt) {
  return Lexer.lex(src, opt);
};

marked.InlineLexer = InlineLexer;
marked.inlineLexer = function(src, opt) {
  return InlineLexer.output(src, opt);
};

marked.parse = marked;

if (typeof module !== 'undefined') {
  module.exports = marked;
} else {
  this.marked = marked;
}

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());
