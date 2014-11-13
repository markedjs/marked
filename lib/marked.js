/**
 * marked - a markdown parser
 * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 */

;(function() {

/**
 * Block-Level Grammar
 */

var block = {
  newline: /^\n+/,
  code: /^( {4}[^\n]+\n*)+/,
  fences: noop,
  hr: /^( *[-*_]){3,} *(?:\n+|$)/,
  heading: /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,
  nptable: noop,
  lheading: /^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,
  blockquote: /^( *>[^\n]+(\n(?!def)[^\n]+)*\n*)+/,
  list: /^( *)(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
  html: /^ *(?:comment *(?:\n|\s*$)|closed *(?:\n{2,}|\s*$)|closing *(?:\n{2,}|\s*$))/,
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
  table: noop,
  paragraph: /^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,
  text: /^[^\n]+/
};

block.bullet = /(?:[*+-]|\d+\.)/;
block.item = /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;
block.item = replace(block.item, 'gm')
  (/bull/g, block.bullet)
  ();

block.list = replace(block.list)
  (/bull/g, block.bullet)
  ('hr', '\\n+(?=\\1?(?:[-*_] *){3,}(?:\\n+|$))')
  ('def', '\\n+(?=' + block.def.source + ')')
  ();

block.blockquote = replace(block.blockquote)
  ('def', block.def)
  ();

block._tag = '(?!(?:'
  + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code'
  + '|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo'
  + '|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|[^\\w\\s@]*@)\\b';

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

/**
 * Normal Block Grammar
 */

block.normal = merge({}, block);

/**
 * GFM Block Grammar
 */

block.gfm = merge({}, block.normal, {
  fences: /^ *(`{3,}|~{3,}) *(\S+)? *\n([\s\S]+?)\s*\1 *(?:\n+|$)/,
  paragraph: /^/
});

block.gfm.paragraph = replace(block.paragraph)
  ('(?!', '(?!'
    + block.gfm.fences.source.replace('\\1', '\\2') + '|'
    + block.list.source.replace('\\1', '\\3') + '|')
  ();

/**
 * GFM + Tables Block Grammar
 */

block.tables = merge({}, block.gfm, {
  nptable: /^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,
  table: /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/
});

/**
 * Block Lexer
 */

function Lexer(options) {
  this.tokens = [];
  this.tokens.links = {};
  this.options = options || marked.defaults;
  this.rules = block.normal;

  if (this.options.gfm) {
    if (this.options.tables) {
      this.rules = block.tables;
    } else {
      this.rules = block.gfm;
    }
  }

  if (this.customRules !== {}) {
    this.rules = merge(this.rules, this.customRules);
  }
}

/**
 * Expose Block Rules
 */

Lexer.rules = block;
Lexer.prototype.customRules = {};

/**
 * Static Lex Method
 */

Lexer.lex = function(src, options) {
  var lexer = new Lexer(options);
  return lexer.lex(src);
};

/**
 * Preprocessing
 */

Lexer.prototype.lex = function(src) {
  src = src
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/\u00a0/g, ' ')
    .replace(/\u2424/g, '\n');

  return this.token(src, true);
};

/**
 * Lexing
 */

Lexer.prototype.ruleExecuteOrder = [
  'newline',
  'code',
  'fences',
  'heading',
  'tableNoLeadingPipe',
  'lheading',
  'hr',
  'blockquote',
  'list',
  'html',
  'def',
  'table',
  'topLevelParagraph',
  'text'
];

Lexer.prototype.ruleFunctions = {
  newline: function(tokenVars, top, bq) {
    if (tokenVars.cap = this.rules.newline.exec(tokenVars.src)) {
      tokenVars.src = tokenVars.src.substring(tokenVars.cap[0].length);
      if (tokenVars.cap[0].length > 1) {
        this.tokens.push({
          type: 'space'
        });
      }
    }

    return false;
  },

  code: function(tokenVars, top, bq) {
    if (tokenVars.cap = this.rules.code.exec(tokenVars.src)) {
      tokenVars.src = tokenVars.src.substring(tokenVars.cap[0].length);
      tokenVars.cap = tokenVars.cap[0].replace(/^ {4}/gm, '');
      this.tokens.push({
        type: 'code',
        text: !this.options.pedantic
          ? tokenVars.cap.replace(/\n+$/, '')
          : tokenVars.cap
      });

      return true;
    }

    return false;
  },

  // fences (gfm)
  fences: function(tokenVars, top, bq) {
    if (tokenVars.cap = this.rules.fences.exec(tokenVars.src)) {
      tokenVars.src = tokenVars.src.substring(tokenVars.cap[0].length);
      this.tokens.push({
        type: 'code',
        lang: tokenVars.cap[2],
        text: tokenVars.cap[3]
      });

      return true;
    }
    
    return false;
  },
  
  heading: function(tokenVars, top, bq) {
    if (tokenVars.cap = this.rules.heading.exec(tokenVars.src)) {
      tokenVars.src = tokenVars.src.substring(tokenVars.cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: tokenVars.cap[1].length,
        text: tokenVars.cap[2]
      });

      return true;
    }
    
    return false;
  },

  // table no leading pipe (gfm)
  tableNoLeadingPipe: function(tokenVars, top, bq) {
    if (top && (tokenVars.cap = this.rules.nptable.exec(tokenVars.src))) {
      tokenVars.src = tokenVars.src.substring(tokenVars.cap[0].length);

      tokenVars.item = {
        type: 'table',
        header: tokenVars.cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: tokenVars.cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: tokenVars.cap[3].replace(/\n$/, '').split('\n')
      };

      for (i = 0; i < tokenVars.item.align.length; i++) {
        if (/^ *-+: *$/.test(tokenVars.item.align[i])) {
          tokenVars.item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(tokenVars.item.align[i])) {
          tokenVars.item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(tokenVars.item.align[i])) {
          tokenVars.item.align[i] = 'left';
        } else {
          tokenVars.item.align[i] = null;
        }
      }

      for (i = 0; i < tokenVars.item.cells.length; i++) {
        tokenVars.item.cells[i] = tokenVars.item.cells[i].split(/ *\| */);
      }

      this.tokens.push(tokenVars.item);;

      return true;
    }
    
    return false;
  },

  lheading: function(tokenVars, top, bq) {
    if (tokenVars.cap = this.rules.lheading.exec(tokenVars.src)) {
      tokenVars.src = tokenVars.src.substring(tokenVars.cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: tokenVars.cap[2] === '=' ? 1 : 2,
        text: tokenVars.cap[1]
      });

      return true;
    }
    
    return false;
  },

  hr: function(tokenVars, top, bq) {
    if (tokenVars.cap = this.rules.hr.exec(tokenVars.src)) {
      tokenVars.src = tokenVars.src.substring(tokenVars.cap[0].length);
      this.tokens.push({
        type: 'hr'
      });

      return true;
    }
    
    return false;
  },
  
  blockquote: function(tokenVars, top, bq) {
    if (tokenVars.cap = this.rules.blockquote.exec(tokenVars.src)) {
      tokenVars.src = tokenVars.src.substring(tokenVars.cap[0].length);

      this.tokens.push({
        type: 'blockquote_start'
      });

      tokenVars.cap = tokenVars.cap[0].replace(/^ *> ?/gm, '');

      // Pass `top` to keep the current
      // "toplevel" state. This is exactly
      // how markdown.pl works.
      this.token(tokenVars.cap, top, true);

      this.tokens.push({
        type: 'blockquote_end'
      });;

      return true;
    }
    
    return false;
  },

  list: function(tokenVars, top, bq) {
    if (tokenVars.cap = this.rules.list.exec(tokenVars.src)) {
      tokenVars.src = tokenVars.src.substring(tokenVars.cap[0].length);
      tokenVars.bull = tokenVars.cap[2];

      this.tokens.push({
        type: 'list_start',
        ordered: tokenVars.bull.length > 1
      });

      // Get each top-level tokenVars.item.
      tokenVars.cap = tokenVars.cap[0].match(this.rules.item);

      tokenVars.next = false;
      l = tokenVars.cap.length;
      i = 0;

      for (; i < l; i++) {
        tokenVars.item = tokenVars.cap[i];

        // Remove the list tokenVars.item's tokenVars.bullet
        // so it is seen as the next token.
        tokenVars.space = tokenVars.item.length;
        tokenVars.item = tokenVars.item.replace(/^ *([*+-]|\d+\.) +/, '');

        // Outdent whatever the
        // list tokenVars.item contains. Hacky.
        if (~tokenVars.item.indexOf('\n ')) {
          tokenVars.space -= tokenVars.item.length;
          tokenVars.item = !this.options.pedantic
            ? tokenVars.item.replace(new RegExp('^ {1,' + tokenVars.space + '}', 'gm'), '')
            : tokenVars.item.replace(/^ {1,4}/gm, '');
        }

        // Determine whether the next list tokenVars.item belongs here.
        // Backpedal if it does not belong in this list.
        if (this.options.smartLists && i !== l - 1) {
          tokenVars.b = block.bullet.exec(tokenVars.cap[i + 1])[0];
          if (tokenVars.bull !== tokenVars.b && !(tokenVars.bull.length > 1 && tokenVars.b.length > 1)) {
            tokenVars.src = tokenVars.cap.slice(i + 1).join('\n') + tokenVars.src;
            i = l - 1;
          }
        }

        // Determine whether tokenVars.item is loose or not.
        // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
        // for discount behavior.
        tokenVars.loose = tokenVars.next || /\n\n(?!\s*$)/.test(tokenVars.item);
        if (i !== l - 1) {
          tokenVars.next = tokenVars.item.charAt(tokenVars.item.length - 1) === '\n';
          if (!tokenVars.loose) tokenVars.loose = tokenVars.next;
        }

        this.tokens.push({
          type: tokenVars.loose
            ? 'loose_item_start'
            : 'list_item_start'
        });

        // Recurse.
        this.token(tokenVars.item, false, bq);

        this.tokens.push({
          type: 'list_item_end'
        });
      }

      this.tokens.push({
        type: 'list_end'
      });;

      return true;
    }
    
    return false;
  },

  html: function(tokenVars, top, bq) {
    if (tokenVars.cap = this.rules.html.exec(tokenVars.src)) {
      tokenVars.src = tokenVars.src.substring(tokenVars.cap[0].length);
      this.tokens.push({
        type: this.options.sanitize
          ? 'paragraph'
          : 'html',
        pre: tokenVars.cap[1] === 'pre' || tokenVars.cap[1] === 'script' || tokenVars.cap[1] === 'style',
        text: tokenVars.cap[0]
      });

      return true;
    }
    
    return false;
  },

  def: function(tokenVars, top, bq) {
    if ((!bq && top) && (tokenVars.cap = this.rules.def.exec(tokenVars.src))) {
      tokenVars.src = tokenVars.src.substring(tokenVars.cap[0].length);
      this.tokens.links[tokenVars.cap[1].toLowerCase()] = {
        href: tokenVars.cap[2],
        title: tokenVars.cap[3]
      };

      return true;
    }
    
    return false;
  },

  // table (gfm)
  table: function(tokenVars, top, bq) {
    if (top && (tokenVars.cap = this.rules.table.exec(tokenVars.src))) {
      tokenVars.src = tokenVars.src.substring(tokenVars.cap[0].length);

      tokenVars.item = {
        type: 'table',
        header: tokenVars.cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: tokenVars.cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: tokenVars.cap[3].replace(/(?: *\| *)?\n$/, '').split('\n')
      };

      for (i = 0; i < tokenVars.item.align.length; i++) {
        if (/^ *-+: *$/.test(tokenVars.item.align[i])) {
          tokenVars.item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(tokenVars.item.align[i])) {
          tokenVars.item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(tokenVars.item.align[i])) {
          tokenVars.item.align[i] = 'left';
        } else {
          tokenVars.item.align[i] = null;
        }
      }

      for (i = 0; i < tokenVars.item.cells.length; i++) {
        tokenVars.item.cells[i] = tokenVars.item.cells[i]
          .replace(/^ *\| *| *\| *$/g, '')
          .split(/ *\| */);
      }

      this.tokens.push(tokenVars.item);;

      return true;
    }
    
    return false;
  },

  topLevelParagraph: function(tokenVars, top, bq) {
    if (top && (tokenVars.cap = this.rules.paragraph.exec(tokenVars.src))) {
      tokenVars.src = tokenVars.src.substring(tokenVars.cap[0].length);
      this.tokens.push({
        type: 'paragraph',
        text: tokenVars.cap[1].charAt(tokenVars.cap[1].length - 1) === '\n'
          ? tokenVars.cap[1].slice(0, -1)
          : tokenVars.cap[1]
      });

      return true;
    }
    
    return false;
  },

  text: function(tokenVars, top, bq) {
    if (tokenVars.cap = this.rules.text.exec(tokenVars.src)) {
      // top-level should never reach here.
      tokenVars.src = tokenVars.src.substring(tokenVars.cap[0].length);
      this.tokens.push({
        type: 'text',
        text: tokenVars.cap[0]
      });

      return true;
    }
    
    return false;
  }
};

Lexer.prototype.token = function(src, top, bq) {
  var tokenVars = {
    src: src.replace(/^ +$/gm, ''),
    next: null,
    loose: null,
    cap: null,
    bull: null,
    b: null,
    item: null,
    space: null,
    i: null,
    l: null
  },
  skip = false,
  ruleCount = this.ruleExecuteOrder.length;

  while (tokenVars.src) {

    for (var i = 0; i < ruleCount; i++) {
      skip = this.ruleFunctions[this.ruleExecuteOrder[i]].call(this, tokenVars, top, bq);

      if (skip === true) {
        break;
      }
    }

    if (skip === true) {
      skip = false;
      continue;
    }

    if (tokenVars.src) {
      throw new
        Error('Infinite loop on byte: ' + tokenVars.src.charCodeAt(0));
    }
  }

  return this.tokens;
};

/**
 * Inline-Level Grammar
 */

var inline = {
  escape: /^\\([\\`*{}\[\]()#+\-.!_>])/,
  autolink: /^<([^ >]+(@|:\/)[^ >]+)>/,
  url: noop,
  tag: /^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,
  link: /^!?\[(inside)\]\(href\)/,
  reflink: /^!?\[(inside)\]\s*\[([^\]]*)\]/,
  nolink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,
  strong: /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,
  em: /^\b_((?:__|[\s\S])+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
  code: /^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/,
  br: /^ {2,}\n(?!\s*$)/,
  del: noop,
  text: /^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/
};

inline._inside = /(?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*/;
inline._href = /\s*<?([\s\S]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/;

inline.link = replace(inline.link)
  ('inside', inline._inside)
  ('href', inline._href)
  ();

inline.reflink = replace(inline.reflink)
  ('inside', inline._inside)
  ();

/**
 * Normal Inline Grammar
 */

inline.normal = merge({}, inline);

/**
 * Pedantic Inline Grammar
 */

inline.pedantic = merge({}, inline.normal, {
  strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
  em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/
});

/**
 * GFM Inline Grammar
 */

inline.gfm = merge({}, inline.normal, {
  escape: replace(inline.escape)('])', '~|])')(),
  url: /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,
  del: /^~~(?=\S)([\s\S]*?\S)~~/,
  text: replace(inline.text)
    (']|', '~]|')
    ('|', '|https?://|')
    ()
});

/**
 * GFM + Line Breaks Inline Grammar
 */

inline.breaks = merge({}, inline.gfm, {
  br: replace(inline.br)('{2,}', '*')(),
  text: replace(inline.gfm.text)('{2,}', '*')()
});

/**
 * Inline Lexer & Compiler
 */

function InlineLexer(links, options) {
  this.options = options || marked.defaults;
  this.links = links;
  this.rules = inline.normal;
  this.renderer = this.options.renderer || new Renderer;
  this.renderer.options = this.options;

  if (!this.links) {
    throw new
      Error('Tokens array requires a `links` property.');
  }

  if (this.options.gfm) {
    if (this.options.breaks) {
      this.rules = inline.breaks;
    } else {
      this.rules = inline.gfm;
    }
  } else if (this.options.pedantic) {
    this.rules = inline.pedantic;
  }

  if (this.customRules !== {}) {
    this.rules = merge(this.rules, this.customRules);
  }
}

/**
 * Expose Inline Rules
 */

InlineLexer.rules = inline;
InlineLexer.prototype.customRules = {};

/**
 * Static Lexing/Compiling Method
 */

InlineLexer.output = function(src, links, options) {
  var inline = new InlineLexer(links, options);
  return inline.output(src);
};

/**
 * Lexing/Compiling
 */

InlineLexer.prototype.ruleExecuteOrder = [
  'escape',
  'autolink',
  'url',
  'tag',
  'link',
  'reflink',
  'strong',
  'em',
  'code',
  'br',
  'del',
  'text'
];

InlineLexer.prototype.ruleFunctions = {
  escape: function(outputVars) {
    // escape
    if (outputVars.cap = this.rules.escape.exec(outputVars.src)) {
      outputVars.src = outputVars.src.substring(outputVars.cap[0].length);
      outputVars.out += outputVars.cap[1];
      return true;
    }

    return false;
  },

  autolink: function(outputVars) {
    // autolink
    if (outputVars.cap = this.rules.autolink.exec(outputVars.src)) {
      outputVars.src = outputVars.src.substring(outputVars.cap[0].length);
      if (outputVars.cap[2] === '@') {
        outputVars.text = outputVars.cap[1].charAt(6) === ':'
          ? this.mangle(outputVars.cap[1].substring(7))
          : this.mangle(outputVars.cap[1]);
        outputVars.href = this.mangle('mailto:') + text;
      } else {
        outputVars.text = escape(outputVars.cap[1]);
        outputVars.href = outputVars.text;
      }
      outputVars.out += this.renderer.link(outputVars.href, null, outputVars.text);
      return true;
    }

    return false;
  },

  url: function(outputVars) {
    // url (gfm)
    if (!this.inLink && (outputVars.cap = this.rules.url.exec(outputVars.src))) {
      outputVars.src = outputVars.src.substring(outputVars.cap[0].length);
      outputVars.text = escape(outputVars.cap[1]);
      outputVars.href = outputVars.text;
      outputVars.out += this.renderer.link(outputVars.href, null, outputVars.text);
      return true;
    }

    return false;
  },

  tag: function(outputVars) {
    // tag
    if (outputVars.cap = this.rules.tag.exec(outputVars.src)) {
      if (!this.inLink && /^<a /i.test(outputVars.cap[0])) {
        this.inLink = true;
      } else if (this.inLink && /^<\/a>/i.test(outputVars.cap[0])) {
        this.inLink = false;
      }
      outputVars.src = outputVars.src.substring(outputVars.cap[0].length);
      outputVars.out += this.options.sanitize
        ? escape(outputVars.cap[0])
        : outputVars.cap[0];
      return true;
    }

    return false;
  },

  link: function(outputVars) {
    // link
    if (outputVars.cap = this.rules.link.exec(outputVars.src)) {
      outputVars.src = outputVars.src.substring(outputVars.cap[0].length);
      this.inLink = true;
      outputVars.out += this.outputLink(outputVars.cap, {
        href: outputVars.cap[2],
        title: outputVars.cap[3]
      });
      this.inLink = false;
      return true;
    }

    return false;
  },

  reflink: function(outputVars) {
    // reflink, nolink
    if ((outputVars.cap = this.rules.reflink.exec(outputVars.src))
        || (outputVars.cap = this.rules.nolink.exec(outputVars.src))) {
      outputVars.src = outputVars.src.substring(outputVars.cap[0].length);
      outputVars.link = (outputVars.cap[2] || outputVars.cap[1]).replace(/\s+/g, ' ');
      outputVars.link = this.links[outputVars.link.toLowerCase()];
      if (!outputVars.link || !outputVars.link.href) {
        outputVars.out += outputVars.cap[0].charAt(0);
        outputVars.src = outputVars.cap[0].substring(1) + outputVars.src;
        return true;
      }
      this.inLink = true;
      outputVars.out += this.outputLink(outputVars.cap, outputVars.link);
      this.inLink = false;
      return true;
    }

    return false;
  },

  strong: function(outputVars) {
    // strong
    if (outputVars.cap = this.rules.strong.exec(outputVars.src)) {
      outputVars.src = outputVars.src.substring(outputVars.cap[0].length);
      outputVars.out += this.renderer.strong(this.output(outputVars.cap[2] || outputVars.cap[1]));
      return true;
    }

    return false;
  },

  em: function(outputVars) {
    // em
    if (outputVars.cap = this.rules.em.exec(outputVars.src)) {
      outputVars.src = outputVars.src.substring(outputVars.cap[0].length);
      outputVars.out += this.renderer.em(this.output(outputVars.cap[2] || outputVars.cap[1]));
      return true;
    }

    return false;
  },

  code: function(outputVars) {
    // code
    if (outputVars.cap = this.rules.code.exec(outputVars.src)) {
      outputVars.src = outputVars.src.substring(outputVars.cap[0].length);
      outputVars.out += this.renderer.codespan(escape(outputVars.cap[2], true));
      return true;
    }

    return false;
  },

  br: function(outputVars) {
    // br
    if (outputVars.cap = this.rules.br.exec(outputVars.src)) {
      outputVars.src = outputVars.src.substring(outputVars.cap[0].length);
      outputVars.out += this.renderer.br();
      return true;
    }

    return false;
  },

  del: function(outputVars) {
    // del (gfm)
    if (outputVars.cap = this.rules.del.exec(outputVars.src)) {
      outputVars.src = outputVars.src.substring(outputVars.cap[0].length);
      outputVars.out += this.renderer.del(this.output(outputVars.cap[1]));
      return true;
    }

    return false;
  },

  text: function(outputVars) {
    // text
    if (outputVars.cap = this.rules.text.exec(outputVars.src)) {
      outputVars.src = outputVars.src.substring(outputVars.cap[0].length);
      outputVars.out += escape(this.smartypants(outputVars.cap[0]));
      return true;
    }

    return false;
  }
};

InlineLexer.prototype.output = function(src) {
  var outputVars = {
    src: src,
    out: '',
    link: null,
    text: null,
    href: null,
    cap: null
  },
  skip = false,
  ruleCount = this.ruleExecuteOrder.length;

  while (outputVars.src) {

    for (var i = 0; i < ruleCount; i++) {
      skip = this.ruleFunctions[this.ruleExecuteOrder[i]].call(this, outputVars);

      if (skip === true) {
        break;
      }
    }

    if (skip === true) {
      skip = false;
      continue;
    }

    if (outputVars.src) {
      throw new
        Error('Infinite loop on byte: ' + outputVars.src.charCodeAt(0));
    }
  }

  return outputVars.out;
};

/**
 * Compile Link
 */

InlineLexer.prototype.outputLink = function(cap, link) {
  var href = escape(link.href)
    , title = link.title ? escape(link.title) : null;

  return cap[0].charAt(0) !== '!'
    ? this.renderer.link(href, title, this.output(cap[1]))
    : this.renderer.image(href, title, escape(cap[1]));
};

/**
 * Smartypants Transformations
 */

InlineLexer.prototype.smartypants = function(text) {
  if (!this.options.smartypants) return text;
  return text
    // em-dashes
    .replace(/--/g, '\u2014')
    // opening singles
    .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
    // closing singles & apostrophes
    .replace(/'/g, '\u2019')
    // opening doubles
    .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
    // closing doubles
    .replace(/"/g, '\u201d')
    // ellipses
    .replace(/\.{3}/g, '\u2026');
};

/**
 * Mangle Links
 */

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
 * Renderer
 */

function Renderer(options) {
  this.options = options || {};
}

Renderer.prototype.code = function(code, lang, escaped) {
  if (this.options.highlight) {
    var out = this.options.highlight(code, lang);
    if (out != null && out !== code) {
      escaped = true;
      code = out;
    }
  }

  if (!lang) {
    return '<pre><code>'
      + (escaped ? code : escape(code, true))
      + '\n</code></pre>';
  }

  return '<pre><code class="'
    + this.options.langPrefix
    + escape(lang, true)
    + '">'
    + (escaped ? code : escape(code, true))
    + '\n</code></pre>\n';
};

Renderer.prototype.blockquote = function(quote) {
  return '<blockquote>\n' + quote + '</blockquote>\n';
};

Renderer.prototype.html = function(html) {
  return html;
};

Renderer.prototype.heading = function(text, level, raw) {
  return '<h'
    + level
    + ' id="'
    + this.options.headerPrefix
    + raw.toLowerCase().replace(/[^\w]+/g, '-')
    + '">'
    + text
    + '</h'
    + level
    + '>\n';
};

Renderer.prototype.hr = function() {
  return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
};

Renderer.prototype.list = function(body, ordered) {
  var type = ordered ? 'ol' : 'ul';
  return '<' + type + '>\n' + body + '</' + type + '>\n';
};

Renderer.prototype.listitem = function(text) {
  return '<li>' + text + '</li>\n';
};

Renderer.prototype.paragraph = function(text) {
  return '<p>' + text + '</p>\n';
};

Renderer.prototype.table = function(header, body) {
  return '<table>\n'
    + '<thead>\n'
    + header
    + '</thead>\n'
    + '<tbody>\n'
    + body
    + '</tbody>\n'
    + '</table>\n';
};

Renderer.prototype.tablerow = function(content) {
  return '<tr>\n' + content + '</tr>\n';
};

Renderer.prototype.tablecell = function(content, flags) {
  var type = flags.header ? 'th' : 'td';
  var tag = flags.align
    ? '<' + type + ' style="text-align:' + flags.align + '">'
    : '<' + type + '>';
  return tag + content + '</' + type + '>\n';
};

// span level renderer
Renderer.prototype.strong = function(text) {
  return '<strong>' + text + '</strong>';
};

Renderer.prototype.em = function(text) {
  return '<em>' + text + '</em>';
};

Renderer.prototype.codespan = function(text) {
  return '<code>' + text + '</code>';
};

Renderer.prototype.br = function() {
  return this.options.xhtml ? '<br/>' : '<br>';
};

Renderer.prototype.del = function(text) {
  return '<del>' + text + '</del>';
};

Renderer.prototype.link = function(href, title, text) {
  if (this.options.sanitize) {
    try {
      var prot = decodeURIComponent(unescape(href))
        .replace(/[^\w:]/g, '')
        .toLowerCase();
    } catch (e) {
      return '';
    }
    if (prot.indexOf('javascript:') === 0) {
      return '';
    }
  }
  var out = '<a href="' + href + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += '>' + text + '</a>';
  return out;
};

Renderer.prototype.image = function(href, title, text) {
  var out = '<img src="' + href + '" alt="' + text + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += this.options.xhtml ? '/>' : '>';
  return out;
};

/**
 * Parsing & Compiling
 */

function Parser(options) {
  this.tokens = [];
  this.token = null;
  this.options = options || marked.defaults;
  this.options.renderer = this.options.renderer || new Renderer;
  this.renderer = this.options.renderer;
  this.renderer.options = this.options;
}

/**
 * Static Parse Method
 */

Parser.parse = function(src, options, renderer) {
  var parser = new Parser(options, renderer);
  return parser.parse(src);
};

/**
 * Parse Loop
 */

Parser.prototype.parse = function(src) {
  this.inline = new InlineLexer(src.links, this.options, this.renderer);
  this.tokens = src.reverse();

  var out = '';
  while (this.next()) {
    out += this.tok();
  }

  return out;
};

/**
 * Next Token
 */

Parser.prototype.next = function() {
  return this.token = this.tokens.pop();
};

/**
 * Preview Next Token
 */

Parser.prototype.peek = function() {
  return this.tokens[this.tokens.length - 1] || 0;
};

/**
 * Parse Text Tokens
 */

Parser.prototype.parseText = function() {
  var body = this.token.text;

  while (this.peek().type === 'text') {
    body += '\n' + this.next().text;
  }

  return this.inline.output(body);
};

/**
 * Parse Current Token
 */

Parser.prototype.ruleParserFunctions = {
  space: function() {
    return '';
  },
  hr: function() {
    return this.renderer.hr();
  },
  heading: function() {
    return this.renderer.heading(
      this.inline.output(this.token.text),
      this.token.depth,
      this.token.text);
  },
  code: function() {
    return this.renderer.code(this.token.text,
      this.token.lang,
      this.token.escaped);
  },
  table: function() {
    var header = ''
      , body = ''
      , i
      , row
      , cell
      , flags
      , j;

    // header
    cell = '';
    for (i = 0; i < this.token.header.length; i++) {
      flags = { header: true, align: this.token.align[i] };
      cell += this.renderer.tablecell(
        this.inline.output(this.token.header[i]),
        { header: true, align: this.token.align[i] }
      );
    }
    header += this.renderer.tablerow(cell);

    for (i = 0; i < this.token.cells.length; i++) {
      row = this.token.cells[i];

      cell = '';
      for (j = 0; j < row.length; j++) {
        cell += this.renderer.tablecell(
          this.inline.output(row[j]),
          { header: false, align: this.token.align[j] }
        );
      }

      body += this.renderer.tablerow(cell);
    }
    return this.renderer.table(header, body);
  },
  blockquote_start: function() {
    var body = '';

    while (this.next().type !== 'blockquote_end') {
      body += this.tok();
    }

    return this.renderer.blockquote(body);
  },
  list_start: function() {
    var body = ''
      , ordered = this.token.ordered;

    while (this.next().type !== 'list_end') {
      body += this.tok();
    }

    return this.renderer.list(body, ordered);
  },
  list_item_start: function() {
    var body = '';

    while (this.next().type !== 'list_item_end') {
      body += this.token.type === 'text'
        ? this.parseText()
        : this.tok();
    }

    return this.renderer.listitem(body);
  },
  loose_item_start: function() {
    var body = '';

    while (this.next().type !== 'list_item_end') {
      body += this.tok();
    }

    return this.renderer.listitem(body);
  },
  html: function() {
    var html = !this.token.pre && !this.options.pedantic
      ? this.inline.output(this.token.text)
      : this.token.text;
    return this.renderer.html(html);
  },
  paragraph: function() {
    return this.renderer.paragraph(this.inline.output(this.token.text));
  },
  text: function() {
    return this.renderer.paragraph(this.parseText());
  }
};

Parser.prototype.tok = function() {
  return this.ruleParserFunctions[this.token.type].call(this);
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

function unescape(html) {
  return html.replace(/&([#\w]+);/g, function(_, n) {
    n = n.toLowerCase();
    if (n === 'colon') return ':';
    if (n.charAt(0) === '#') {
      return n.charAt(1) === 'x'
        ? String.fromCharCode(parseInt(n.substring(2), 16))
        : String.fromCharCode(+n.substring(1));
    }
    return '';
  });
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

function merge(obj) {
  var i = 1
    , target
    , key;

  for (; i < arguments.length; i++) {
    target = arguments[i];
    for (key in target) {
      if (Object.prototype.hasOwnProperty.call(target, key)) {
        obj[key] = target[key];
      }
    }
  }

  return obj;
}

/**
 * Register a rule
    var _rule = {
      // determines the position, starting from the end, when this rule be
      // evaluated
      positionFromEnd: 1,
      regExp: /\$\$\$/,
      name: 'myNewRule',
      parser: function() {
        return this.renderer.myNewRule(this.token.text);
      },
      renderer: function(text) {
        return 'modified ' + text;
      },

      // Inline rule
      type: 'inline',
      action: function(outputVars) {
        if (outputVars.cap = this.rules.myNewRule.exec(outputVars.src)) {
          outputVars.src = outputVars.src.substring(outputVars.cap[0].length);
          outputVars.out += this.renderer.myNewRule(outputVars.cap[0]);

          return true;
        }

        return false;
      },

      // Block rule
      type: 'block',
      action: function(tokenVars, top, bq) {
        if (tokenVars.cap = this.rules.myNewRule.exec(tokenVars.src)) {
          tokenVars.src = tokenVars.src.substring(tokenVars.cap[0].length);
          this.tokens.push({
            type: 'myNewRule',
            text: tokenVars.cap
          });

          return true;
        }

        return false;
      }
    }
 */
function registerRule(_rule) {
  var ruleDefaults = {
    positionFromEnd: 1
  }

  var rule = merge(ruleDefaults, _rule);

  Renderer.prototype[rule.name] = rule.renderer;
  marked.setOptions({
    renderer: new Renderer
  });

  Parser.prototype.ruleParserFunctions[rule.name] = rule.parser;

  switch (rule.type) {
    case 'block': {
      Lexer.prototype.customRules = Lexer.prototype.customRules || {};
      Lexer.prototype.customRules[rule.name] = rule.regExp;
      Lexer.prototype.ruleExecuteOrder.splice(Lexer.prototype.ruleExecuteOrder.length - rule.positionFromEnd, 0, rule.name);
      Lexer.prototype.ruleFunctions[rule.name] = rule.action;
      break;
    }
    default: {
      InlineLexer.prototype.customRules = InlineLexer.prototype.customRules || {};
      InlineLexer.prototype.customRules[rule.name] = rule.regExp;
      InlineLexer.prototype.ruleExecuteOrder.splice(InlineLexer.prototype.ruleExecuteOrder.length - rule.positionFromEnd, 0, rule.name);
      InlineLexer.prototype.ruleFunctions[rule.name] = rule.action;
    }
  }
}

/**
 * Marked
 */

function marked(src, opt, callback) {
  if (callback || typeof opt === 'function') {
    if (!callback) {
      callback = opt;
      opt = null;
    }

    opt = merge({}, marked.defaults, opt || {});

    var highlight = opt.highlight
      , tokens
      , pending
      , i = 0;

    try {
      tokens = Lexer.lex(src, opt)
    } catch (e) {
      return callback(e);
    }

    pending = tokens.length;

    var done = function(err) {
      if (err) {
        opt.highlight = highlight;
        return callback(err);
      }

      var out;

      try {
        out = Parser.parse(tokens, opt);
      } catch (e) {
        err = e;
      }

      opt.highlight = highlight;

      return err
        ? callback(err)
        : callback(null, out);
    };

    if (!highlight || highlight.length < 3) {
      return done();
    }

    delete opt.highlight;

    if (!pending) return done();

    for (; i < tokens.length; i++) {
      (function(token) {
        if (token.type !== 'code') {
          return --pending || done();
        }
        return highlight(token.text, token.lang, function(err, code) {
          if (err) return done(err);
          if (code == null || code === token.text) {
            return --pending || done();
          }
          token.text = code;
          token.escaped = true;
          --pending || done();
        });
      })(tokens[i]);
    }

    return;
  }
  try {
    if (opt) opt = merge({}, marked.defaults, opt);
    return Parser.parse(Lexer.lex(src, opt), opt);
  } catch (e) {
    e.message += '\nPlease report this to https://github.com/chjj/marked.';
    if ((opt || marked.defaults).silent) {
      return '<p>An error occured:</p><pre>'
        + escape(e.message + '', true)
        + '</pre>';
    }
    throw e;
  }
}

/**
 * Options
 */

marked.options =
marked.setOptions = function(opt) {
  merge(marked.defaults, opt);
  return marked;
};

marked.defaults = {
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: false,
  silent: false,
  highlight: null,
  langPrefix: 'lang-',
  smartypants: false,
  headerPrefix: '',
  renderer: new Renderer,
  xhtml: false
};

/**
 * Expose
 */

marked.Parser = Parser;
marked.parser = Parser.parse;

marked.Renderer = Renderer;

marked.Lexer = Lexer;
marked.lexer = Lexer.lex;

marked.InlineLexer = InlineLexer;
marked.inlineLexer = InlineLexer.output;

marked.parse = marked;

marked.registerRule = registerRule;

if (typeof module !== 'undefined' && typeof exports === 'object') {
  module.exports = marked;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return marked; });
} else {
  this.marked = marked;
}

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());
