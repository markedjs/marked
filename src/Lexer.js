const { defaults } = require('./defaults.js');
const { block, inline } = require('./rules.js');
const {
  rtrim,
  splitCells,
  escape,
  findClosingBracket
} = require('./helpers.js');

/**
 * Block Lexer
 */
module.exports = class Lexer {
  constructor(options) {
    this.tokens = [];
    this.tokens.links = Object.create(null);
    this.options = options || defaults;
    this.rules = {
      block: block.normal,
      inline: inline.normal
    };

    if (this.options.pedantic) {
      this.rules.block = block.pedantic;
      this.rules.inline = inline.pedantic;
    } else if (this.options.gfm) {
      this.rules.block = block.gfm;
      if (this.options.breaks) {
        this.rules.inline = inline.breaks;
      } else {
        this.rules.inline = inline.gfm;
      }
    }
  }

  /**
   * Expose Block Rules
   */
  static get rules() {
    return {
      block,
      inline
    };
  }

  /**
   * Static Lex Method
   */
  static lex(src, options) {
    const lexer = new Lexer(options);
    return lexer.lex(src);
  }

  /**
   * Preprocessing
   */
  lex(src) {
    src = src
      .replace(/\r\n|\r/g, '\n')
      .replace(/\t/g, '    ');

    this.blockTokens(this.tokens, src, true);

    this.inlineTokens(this.tokens);

    return this.tokens;
  }

  /**
   * Lexing
   */
  blockTokens(tokens, src, top) {
    src = src.replace(/^ +$/gm, '');
    let next,
      loose,
      cap,
      bull,
      b,
      item,
      list,
      space,
      i,
      tag,
      l,
      isordered,
      istask,
      ischecked,
      raw;

    while (src) {
      // newline
      if (cap = this.rules.block.newline.exec(src)) {
        src = src.substring(cap[0].length);
        raw = cap[0];
        if (cap[0].length > 1) {
          tokens.push({
            type: 'space',
            raw
          });
        }
      }

      // code
      if (cap = this.rules.block.code.exec(src)) {
        const lastToken = tokens[tokens.length - 1];
        src = src.substring(cap[0].length);
        raw = cap[0];
        // An indented code block cannot interrupt a paragraph.
        if (lastToken && lastToken.type === 'paragraph') {
          lastToken.text += '\n' + cap[0].trimRight();
          lastToken.raw += '\n' + raw;
        } else {
          cap = cap[0].replace(/^ {4}/gm, '');
          tokens.push({
            type: 'code',
            raw,
            codeBlockStyle: 'indented',
            text: !this.options.pedantic
              ? rtrim(cap, '\n')
              : cap
          });
        }
        continue;
      }

      // fences
      if (cap = this.rules.block.fences.exec(src)) {
        src = src.substring(cap[0].length);
        raw = cap[0];
        tokens.push({
          type: 'code',
          raw,
          lang: cap[2] ? cap[2].trim() : cap[2],
          text: cap[3] || ''
        });
        continue;
      }

      // heading
      if (cap = this.rules.block.heading.exec(src)) {
        src = src.substring(cap[0].length);
        raw = cap[0];
        tokens.push({
          type: 'heading',
          raw,
          depth: cap[1].length,
          text: cap[2]
        });
        continue;
      }

      // table no leading pipe (gfm)
      if (cap = this.rules.block.nptable.exec(src)) {
        item = {
          type: 'table',
          header: splitCells(cap[1].replace(/^ *| *\| *$/g, '')),
          align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
          cells: cap[3] ? cap[3].replace(/\n$/, '').split('\n') : []
        };

        if (item.header.length === item.align.length) {
          src = src.substring(cap[0].length);
          raw = cap[0];
          item.raw = raw;

          l = item.align.length;
          for (i = 0; i < l; i++) {
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

          l = item.cells.length;
          for (i = 0; i < l; i++) {
            item.cells[i] = splitCells(item.cells[i], item.header.length);
          }

          tokens.push(item);

          continue;
        }
      }

      // hr
      if (cap = this.rules.block.hr.exec(src)) {
        src = src.substring(cap[0].length);
        raw = cap[0];
        tokens.push({
          type: 'hr',
          raw
        });
        continue;
      }

      // blockquote
      if (cap = this.rules.block.blockquote.exec(src)) {
        src = src.substring(cap[0].length);
        raw = cap[0];

        cap = cap[0].replace(/^ *> ?/gm, '');

        tokens.push({
          type: 'blockquote',
          raw,
          tokens: this.blockTokens([], cap, top)
        });

        continue;
      }

      // list
      if (cap = this.rules.block.list.exec(src)) {
        src = src.substring(cap[0].length);
        raw = cap[0];
        bull = cap[2];
        isordered = bull.length > 1;

        list = {
          type: 'list',
          raw,
          ordered: isordered,
          start: isordered ? +bull : '',
          loose: false,
          items: []
        };

        tokens.push(list);

        // Get each top-level item.
        cap = cap[0].match(this.rules.block.item);

        next = false;

        l = cap.length;
        for (i = 0; i < l; i++) {
          item = cap[i];
          raw = item.trim();

          // Remove the list item's bullet
          // so it is seen as the next token.
          space = item.length;
          item = item.replace(/^ *([*+-]|\d+\.) */, '');

          // Outdent whatever the
          // list item contains. Hacky.
          if (~item.indexOf('\n ')) {
            space -= item.length;
            item = !this.options.pedantic
              ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
              : item.replace(/^ {1,4}/gm, '');
          }

          // Determine whether the next list item belongs here.
          // Backpedal if it does not belong in this list.
          if (i !== l - 1) {
            b = block.bullet.exec(cap[i + 1])[0];
            if (bull.length > 1 ? b.length === 1
              : (b.length > 1 || (this.options.smartLists && b !== bull))) {
              const addBack = cap.slice(i + 1).join('\n');
              src = addBack + src;
              list.raw = list.raw.substring(list.raw.length - addBack.length);
              i = l - 1;
            }
          }

          // Determine whether item is loose or not.
          // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
          // for discount behavior.
          loose = next || /\n\n(?!\s*$)/.test(item);
          if (i !== l - 1) {
            next = item.charAt(item.length - 1) === '\n';
            if (!loose) loose = next;
          }

          if (loose) {
            list.loose = true;
          }

          // Check for task list items
          istask = /^\[[ xX]\] /.test(item);
          ischecked = undefined;
          if (istask) {
            ischecked = item[1] !== ' ';
            item = item.replace(/^\[[ xX]\] +/, '');
          }

          list.items.push({
            raw,
            task: istask,
            checked: ischecked,
            loose: loose,
            tokens: this.blockTokens([], item, false)
          });
        }

        continue;
      }

      // html
      if (cap = this.rules.block.html.exec(src)) {
        src = src.substring(cap[0].length);
        raw = cap[0];
        tokens.push({
          type: this.options.sanitize
            ? 'paragraph'
            : 'html',
          raw,
          pre: !this.options.sanitizer
            && (cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style'),
          text: this.options.sanitize ? (this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape(cap[0])) : cap[0]
        });
        continue;
      }

      // def
      if (top && (cap = this.rules.block.def.exec(src))) {
        src = src.substring(cap[0].length);
        if (cap[3]) cap[3] = cap[3].substring(1, cap[3].length - 1);
        tag = cap[1].toLowerCase().replace(/\s+/g, ' ');
        if (!this.tokens.links[tag]) {
          this.tokens.links[tag] = {
            href: cap[2],
            title: cap[3]
          };
        }
        continue;
      }

      // table (gfm)
      if (cap = this.rules.block.table.exec(src)) {
        item = {
          type: 'table',
          header: splitCells(cap[1].replace(/^ *| *\| *$/g, '')),
          align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
          cells: cap[3] ? cap[3].replace(/\n$/, '').split('\n') : []
        };

        if (item.header.length === item.align.length) {
          src = src.substring(cap[0].length);
          item.raw = cap[0];

          l = item.align.length;
          for (i = 0; i < l; i++) {
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

          l = item.cells.length;
          for (i = 0; i < l; i++) {
            item.cells[i] = splitCells(
              item.cells[i].replace(/^ *\| *| *\| *$/g, ''),
              item.header.length);
          }

          tokens.push(item);

          continue;
        }
      }

      // lheading
      if (cap = this.rules.block.lheading.exec(src)) {
        src = src.substring(cap[0].length);
        raw = cap[0];
        tokens.push({
          type: 'heading',
          raw,
          depth: cap[2].charAt(0) === '=' ? 1 : 2,
          text: cap[1]
        });
        continue;
      }

      // top-level paragraph
      if (top && (cap = this.rules.block.paragraph.exec(src))) {
        src = src.substring(cap[0].length);
        raw = cap[0];
        tokens.push({
          type: 'paragraph',
          raw,
          text: cap[1].charAt(cap[1].length - 1) === '\n'
            ? cap[1].slice(0, -1)
            : cap[1]
        });
        continue;
      }

      // text
      if (cap = this.rules.block.text.exec(src)) {
        // Top-level should never reach here.
        src = src.substring(cap[0].length);
        raw = cap[0];
        tokens.push({
          type: 'text',
          raw,
          text: cap[0]
        });
        continue;
      }

      if (src) {
        const errMsg = 'Infinite loop on byte: ' + src.charCodeAt(0);
        if (this.options.silent) {
          console.error(errMsg);
        } else {
          throw new Error(errMsg);
        }
      }
    }

    return tokens;
  }

  inlineTokens(tokens) {
    let i,
      j,
      k,
      l2,
      row,
      token;

    const l = tokens.length;
    for (i = 0; i < l; i++) {
      token = tokens[i];
      switch (token.type) {
        case 'paragraph':
        case 'text':
        case 'heading': {
          token.tokens = [];
          this.inlineOutput(token.text, token.tokens);
          break;
        }
        case 'table': {
          token.tokens = {
            header: [],
            cells: []
          };

          // header
          l2 = token.header.length;
          for (j = 0; j < l2; j++) {
            token.tokens.header[j] = [];
            this.inlineOutput(token.header[j], token.tokens.header[j]);
          }

          // cells
          l2 = token.cells.length;
          for (j = 0; j < l2; j++) {
            row = token.cells[j];
            token.tokens.cells[j] = [];
            for (k = 0; k < row.length; k++) {
              token.tokens.cells[j][k] = [];
              this.inlineOutput(row[k], token.tokens.cells[j][k]);
            }
          }

          break;
        }
        case 'blockquote': {
          this.inlineTokens(token.tokens);
          break;
        }
        case 'list': {
          l2 = token.items.length;
          for (j = 0; j < l2; j++) {
            this.inlineTokens(token.items[j].tokens);
          }
          break;
        }
        default: {
          // do nothing
        }
      }
    }

    return tokens;
  }

  /**
   * Lexing/Compiling
   */
  inlineOutput(src, tokens) {
    let out = '',
      link,
      text,
      newTokens,
      href,
      title,
      cap,
      prevCapZero,
      raw;

    while (src) {
      // escape
      if (cap = this.rules.inline.escape.exec(src)) {
        src = src.substring(cap[0].length);
        raw = cap[0];
        text = escape(cap[1]);
        out += text;
        tokens.push({
          type: 'escape',
          raw,
          text
        });
        continue;
      }

      // tag
      if (cap = this.rules.inline.tag.exec(src)) {
        if (!this.inLink && /^<a /i.test(cap[0])) {
          this.inLink = true;
        } else if (this.inLink && /^<\/a>/i.test(cap[0])) {
          this.inLink = false;
        }
        if (!this.inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
          this.inRawBlock = true;
        } else if (this.inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
          this.inRawBlock = false;
        }

        src = src.substring(cap[0].length);
        raw = cap[0];
        text = this.options.sanitize
          ? (this.options.sanitizer
            ? this.options.sanitizer(cap[0])
            : escape(cap[0]))
          : cap[0];
        tokens.push({
          type: this.options.sanitize
            ? 'text'
            : 'html',
          raw,
          text
        });
        out += text;
        continue;
      }

      // link
      if (cap = this.rules.inline.link.exec(src)) {
        const lastParenIndex = findClosingBracket(cap[2], '()');
        if (lastParenIndex > -1) {
          const start = cap[0].indexOf('!') === 0 ? 5 : 4;
          const linkLen = start + cap[1].length + lastParenIndex;
          cap[2] = cap[2].substring(0, lastParenIndex);
          cap[0] = cap[0].substring(0, linkLen).trim();
          cap[3] = '';
        }
        src = src.substring(cap[0].length);
        raw = cap[0];
        this.inLink = true;
        href = cap[2];
        if (this.options.pedantic) {
          link = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(href);

          if (link) {
            href = link[1];
            title = link[3];
          } else {
            title = '';
          }
        } else {
          title = cap[3] ? cap[3].slice(1, -1) : '';
        }
        href = href.trim().replace(/^<([\s\S]*)>$/, '$1');
        out += this.outputLink(cap, {
          href: this.escapes(href),
          title: this.escapes(title)
        }, tokens, raw);
        this.inLink = false;
        continue;
      }

      // reflink, nolink
      if ((cap = this.rules.inline.reflink.exec(src))
          || (cap = this.rules.inline.nolink.exec(src))) {
        src = src.substring(cap[0].length);
        raw = cap[0];
        link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
        link = this.tokens.links[link.toLowerCase()];
        if (!link || !link.href) {
          text = cap[0].charAt(0);
          out += text;
          tokens.push({
            type: 'text',
            raw: text,
            text
          });
          src = cap[0].substring(1) + src;
          continue;
        }
        this.inLink = true;
        out += this.outputLink(cap, link, tokens, raw);
        this.inLink = false;
        continue;
      }

      // strong
      if (cap = this.rules.inline.strong.exec(src)) {
        src = src.substring(cap[0].length);
        raw = cap[0];
        newTokens = tokens ? [] : null;
        text = this.inlineOutput(cap[4] || cap[3] || cap[2] || cap[1], newTokens);

        tokens.push({
          type: 'strong',
          raw,
          text,
          tokens: newTokens
        });
        out += text;
        continue;
      }

      // em
      if (cap = this.rules.inline.em.exec(src)) {
        src = src.substring(cap[0].length);
        raw = cap[0];
        newTokens = tokens ? [] : null;
        text = this.inlineOutput(cap[6] || cap[5] || cap[4] || cap[3] || cap[2] || cap[1], newTokens);
        tokens.push({
          type: 'em',
          raw,
          text,
          tokens: newTokens
        });
        out += text;
        continue;
      }

      // code
      if (cap = this.rules.inline.code.exec(src)) {
        src = src.substring(cap[0].length);
        raw = cap[0];
        text = escape(cap[2].trim(), true);
        tokens.push({
          type: 'codespan',
          raw,
          text
        });
        out += text;
        continue;
      }

      // br
      if (cap = this.rules.inline.br.exec(src)) {
        src = src.substring(cap[0].length);
        raw = cap[0];
        tokens.push({
          type: 'br',
          raw
        });
        out += '\n';
        continue;
      }

      // del (gfm)
      if (cap = this.rules.inline.del.exec(src)) {
        src = src.substring(cap[0].length);
        raw = cap[0];
        newTokens = tokens ? [] : null;
        text = this.inlineOutput(cap[1], newTokens);
        tokens.push({
          type: 'del',
          raw,
          text,
          tokens: newTokens
        });
        out += text;
        continue;
      }

      // autolink
      if (cap = this.rules.inline.autolink.exec(src)) {
        src = src.substring(cap[0].length);
        raw = cap[0];
        if (cap[2] === '@') {
          text = escape(this.options.mangle ? this.mangle(cap[1]) : cap[1]);
          href = 'mailto:' + text;
        } else {
          text = escape(cap[1]);
          href = text;
        }
        tokens.push({
          type: 'link',
          raw,
          text,
          href,
          tokens: [
            {
              type: 'text',
              raw: text,
              text
            }
          ]
        });
        out += text;
        continue;
      }

      // url (gfm)
      if (!this.inLink && (cap = this.rules.inline.url.exec(src))) {
        if (cap[2] === '@') {
          text = escape(this.options.mangle ? this.mangle(cap[0]) : cap[0]);
          href = 'mailto:' + text;
        } else {
          // do extended autolink path validation
          do {
            prevCapZero = cap[0];
            cap[0] = this.rules.inline._backpedal.exec(cap[0])[0];
          } while (prevCapZero !== cap[0]);
          text = escape(cap[0]);
          if (cap[1] === 'www.') {
            href = 'http://' + text;
          } else {
            href = text;
          }
        }
        src = src.substring(cap[0].length);
        raw = cap[0];
        tokens.push({
          type: 'link',
          raw,
          text,
          href,
          tokens: [
            {
              type: 'text',
              raw: text,
              text
            }
          ]
        });
        out += text;
        continue;
      }

      // text
      if (cap = this.rules.inline.text.exec(src)) {
        src = src.substring(cap[0].length);
        raw = cap[0];
        if (this.inRawBlock) {
          text = this.options.sanitize ? (this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape(cap[0])) : cap[0];
        } else {
          text = escape(this.options.smartypants ? this.smartypants(cap[0]) : cap[0]);
        }
        tokens.push({
          type: 'text',
          raw,
          text
        });
        out += text;
        continue;
      }

      if (src) {
        const errMsg = 'Infinite loop on byte: ' + src.charCodeAt(0);
        if (this.options.silent) {
          console.error(errMsg);
        } else {
          throw new Error(errMsg);
        }
      }
    }

    return out;
  }

  escapes(text) {
    return text ? text.replace(inline._escapes, '$1') : text;
  }

  /**
   * tokenize Link
   */
  outputLink(cap, link, tokens, raw) {
    const href = link.href;
    const title = link.title ? escape(link.title) : null;
    const newTokens = tokens ? [] : null;

    if (cap[0].charAt(0) !== '!') {
      const text = this.inlineOutput(cap[1], newTokens);
      tokens.push({
        type: 'link',
        raw,
        text,
        href,
        title,
        tokens: newTokens
      });
      return text;
    } else {
      const text = escape(cap[1]);
      tokens.push({
        type: 'image',
        raw,
        text,
        href,
        title
      });
      return text;
    }
  }

  /**
   * Smartypants Transformations
   */
  smartypants(text) {
    return text
      // em-dashes
      .replace(/---/g, '\u2014')
      // en-dashes
      .replace(/--/g, '\u2013')
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
  }

  /**
   * Mangle Links
   */
  mangle(text) {
    let out = '',
      i,
      ch;

    const l = text.length;
    for (i = 0; i < l; i++) {
      ch = text.charCodeAt(i);
      if (Math.random() > 0.5) {
        ch = 'x' + ch.toString(16);
      }
      out += '&#' + ch + ';';
    }

    return out;
  }
};
