const { defaults } = require('./defaults.js');
const { block } = require('./rules.js');
const {
  rtrim,
  splitCells,
  escape
} = require('./helpers.js');

/**
 * Block Lexer
 */
module.exports = class Lexer {
  constructor(options) {
    this.tokens = [];
    this.tokens.links = Object.create(null);
    this.options = options || defaults;
    this.rules = block.normal;

    if (this.options.pedantic) {
      this.rules = block.pedantic;
    } else if (this.options.gfm) {
      this.rules = block.gfm;
    }
  }

  /**
   * Expose Block Rules
   */
  static get rules() {
    return block;
  }

  /**
   * Static Lex Method
   */
  static lex(src, options) {
    const lexer = new Lexer(options);
    return lexer.lex(src);
  };

  /**
   * Preprocessing
   */
  lex(src) {
    src = src
      .replace(/\r\n|\r/g, '\n')
      .replace(/\t/g, '    ');

    return this.token(src, true);
  };

  /**
   * Lexing
   */
  token(src, top) {
    src = src.replace(/^ +$/gm, '');
    let cap;

    while (src) {
      // newline
      if (cap = this.rules.newline.exec(src)) {
        if (this.newline(cap)) { src = src.substring(cap[0].length); continue; }
      }

      // code
      if (cap = this.rules.code.exec(src)) {
        if (this.code(cap)) { src = src.substring(cap[0].length); continue; }
      }

      // fences
      if (cap = this.rules.fences.exec(src)) {
        if (this.fences(cap)) { src = src.substring(cap[0].length); continue; }
      }

      // heading
      if (cap = this.rules.heading.exec(src)) {
        if (this.heading(cap)) { src = src.substring(cap[0].length); continue; }
      }

      // table no leading pipe (gfm)
      if (cap = this.rules.nptable.exec(src)) {
        if (this.nptable(cap)) { src = src.substring(cap[0].length); continue; }
      }

      // hr
      if (cap = this.rules.hr.exec(src)) {
        if (this.hr(cap)) { src = src.substring(cap[0].length); continue; }
      }

      // blockquote
      if (cap = this.rules.blockquote.exec(src)) {
        if (this.blockquote(cap, top)) { src = src.substring(cap[0].length); continue; }
      }

      // list
      if (cap = this.rules.list.exec(src)) {
        if (this.list(cap, top)) { src = src.substring(cap[0].length); continue; }
      }

      // html
      if (cap = this.rules.html.exec(src)) {
        if (this.html(cap)) { src = src.substring(cap[0].length); continue; }
      }

      // def
      if (top && (cap = this.rules.def.exec(src))) {
        if (this.def(cap)) { src = src.substring(cap[0].length); continue; }
      }

      // table (gfm)
      if (cap = this.rules.table.exec(src)) {
        if (this.table(cap)) { src = src.substring(cap[0].length); continue; }
      }

      // lheading
      if (cap = this.rules.lheading.exec(src)) {
        if (this.lheading(cap)) { src = src.substring(cap[0].length); continue; }
      }

      // top-level paragraph
      if (top && (cap = this.rules.paragraph.exec(src))) {
        if (this.paragraph(cap)) { src = src.substring(cap[0].length); continue; }
      }

      // text -- Top-level should never reach here.
      if (cap = this.rules.text.exec(src)) {
        if (this.text(cap)) { src = src.substring(cap[0].length); continue; }
      }

      if (src) {
        throw new Error('Infinite loop on byte: ' + src.charCodeAt(0));
      }
    }

    return this.tokens;
  };

  newline(cap) {
    if (cap[0].length > 1) {
      this.tokens.push({
        type: 'space'
      });
    }
    return true;
  };

  code(cap) {
    const lastToken = this.tokens[this.tokens.length - 1];
    // An indented code block cannot interrupt a paragraph.
    if (lastToken && lastToken.type === 'paragraph') {
      lastToken.text += '\n' + cap[0].trimRight();
    } else {
      cap = cap[0].replace(/^ {4}/gm, '');
      this.tokens.push({
        type: 'code',
        codeBlockStyle: 'indented',
        text: !this.options.pedantic
          ? rtrim(cap, '\n')
          : cap
      });
    }
    return true;
  };

  fences(cap) {
    this.tokens.push({
      type: 'code',
      lang: cap[2] ? cap[2].trim() : cap[2],
      text: cap[3] || ''
    });
    return true;
  }

  heading(cap) {
    this.tokens.push({
      type: 'heading',
      depth: cap[1].length,
      text: cap[2]
    });
    return true;
  }

  nptable(cap) {
    const item = {
      type: 'table',
      header: splitCells(cap[1].replace(/^ *| *\| *$/g, '')),
      align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
      cells: cap[3] ? cap[3].replace(/\n$/, '').split('\n') : []
    };

    if (item.header.length === item.align.length) {
      for (let i = 0; i < item.align.length; i++) {
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

      for (let i = 0; i < item.cells.length; i++) {
        item.cells[i] = splitCells(item.cells[i], item.header.length);
      }

      this.tokens.push(item);
      return true;
    }
  }

  table(cap) {
    const item = {
      type: 'table',
      header: splitCells(cap[1].replace(/^ *| *\| *$/g, '')),
      align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
      cells: cap[3] ? cap[3].replace(/\n$/, '').split('\n') : []
    };

    if (item.header.length === item.align.length) {
      for (let i = 0; i < item.align.length; i++) {
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

      for (let i = 0; i < item.cells.length; i++) {
        item.cells[i] = splitCells(
          item.cells[i].replace(/^ *\| *| *\| *$/g, ''),
          item.header.length);
      }

      this.tokens.push(item);
      return true;
    }
  }

  hr(cap) {
    this.tokens.push({
      type: 'hr'
    });
    return true;
  }

  blockquote(cap, top) {
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
    return true;
  }

  list(cap, top) {
    const bull = cap[2];
    const isordered = bull.length > 1; // numbered will be (#.), so at least 2 characters long

    const listStart = {
      type: 'list_start',
      ordered: isordered,
      start: isordered ? +bull : '',
      loose: false
    };

    this.tokens.push(listStart);

    // Get each top-level item.
    cap = cap[0].match(this.rules.item);

    const listItems = [];
    let l = cap.length;
    let i = 0;
    let split = false;

    for (; i < l; i++) {
      let item = cap[i];

      // Remove the list item's bullet
      // so it is seen as the next token.
      let space = item.length;
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
      // Split into a new list if it does not belong in this list.
      if (i !== l - 1) {
        const b = block.bullet.exec(cap[i + 1])[0];
        if (isordered ? b.length === 1
          : (b.length > 1 || (this.options.smartLists && b !== bull))) {
          cap = cap.slice(i + 1).join('\n');
          split = true;
          i = l - 1;
        }
      }

      // Determine whether item is loose or not.
      // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
      // for discount behavior.
      let loose = /\n\n(?!\s*$)/.test(item);
      if (i !== l - 1) {
        if (!loose) { loose = item.charAt(item.length - 1) === '\n'; }
      }

      if (loose) {
        listStart.loose = true;
      }

      // Check for task list items
      const istask = /^\[[ xX]\] /.test(item);
      let ischecked;
      if (istask) {
        ischecked = item[1] !== ' ';
        item = item.replace(/^\[[ xX]\] +/, '');
      }

      const t = {
        type: 'list_item_start',
        task: istask,
        checked: ischecked,
        loose: loose
      };

      listItems.push(t);
      this.tokens.push(t);

      // Recurse.
      this.token(item, false);

      this.tokens.push({
        type: 'list_item_end'
      });
    }

    if (listStart.loose) {
      l = listItems.length;
      i = 0;
      for (; i < l; i++) {
        listItems[i].loose = true;
      }
    }

    this.tokens.push({
      type: 'list_end'
    });
    if (split) {
      this.token(cap, top);
    }
    return true;
  }

  html(cap) {
    this.tokens.push({
      type: this.options.sanitize
        ? 'paragraph'
        : 'html',
      pre: !this.options.sanitizer
        && (cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style'),
      text: this.options.sanitize ? (this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape(cap[0])) : cap[0]
    });
    return true;
  }

  def(cap) {
    if (cap[3]) cap[3] = cap[3].substring(1, cap[3].length - 1);
    const tag = cap[1].toLowerCase().replace(/\s+/g, ' ');
    if (!this.tokens.links[tag]) {
      this.tokens.links[tag] = {
        href: cap[2],
        title: cap[3]
      };
    }
    return true;
  }

  lheading(cap) {
    this.tokens.push({
      type: 'heading',
      depth: cap[2].charAt(0) === '=' ? 1 : 2,
      text: cap[1]
    });
    return true;
  }

  paragraph(cap) {
    this.tokens.push({
      type: 'paragraph',
      text: cap[1].charAt(cap[1].length - 1) === '\n'
        ? cap[1].slice(0, -1)
        : cap[1]
    });
    return true;
  }

  text(cap) {
    this.tokens.push({
      type: 'text',
      text: cap[0]
    });
    return true;
  }
};
