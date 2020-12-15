const { defaults } = require('./defaults.js');
const Hooks = require('./Hooks.js');

/**
 * Renderer
 */
module.exports = class Renderer {
  constructor(options) {
    this.options = options || defaults;
    this.options.hooks = this.options.hooks || new Hooks();
    this.options.hooks.options = this.options;
  }

  code(code, infostring, escaped) {
    const lang = (infostring || '').match(/\S*/)[0];
    const out = this.options.hooks.highlight(code, lang);
    if (out != null && out !== code) {
      escaped = true;
      code = out;
    }

    const langClass = this.options.hooks.languageClass(lang);
    return '<pre><code'
      + (langClass ? ' class="' + langClass + '"' : '')
      + '>'
      + (escaped ? code : this.options.hooks.encode(code))
      + '</code></pre>\n';
  }

  blockquote(quote) {
    return '<blockquote>\n' + quote + '</blockquote>\n';
  }

  html(html) {
    return html;
  }

  heading(text, level, raw) {
    const headerId = this.options.hooks.headerId(raw);
    return '<h' + level + (headerId ? ' id="' + headerId + '"' : '') + '>' + text + '</h' + level + '>\n';
  }

  hr() {
    return '<hr>\n';
  }

  list(body, ordered, start) {
    const type = ordered ? 'ol' : 'ul',
      startatt = (ordered && start !== 1) ? (' start="' + start + '"') : '';
    return '<' + type + startatt + '>\n' + body + '</' + type + '>\n';
  }

  listitem(text) {
    return '<li>' + text + '</li>\n';
  }

  checkbox(checked) {
    return '<input '
      + (checked ? 'checked="" ' : '')
      + 'disabled="" type="checkbox"> ';
  }

  paragraph(text) {
    return '<p>' + text + '</p>\n';
  }

  table(header, body) {
    if (body) body = '<tbody>' + body + '</tbody>';

    return '<table>\n'
      + '<thead>\n'
      + header
      + '</thead>\n'
      + body
      + '</table>\n';
  }

  tablerow(content) {
    return '<tr>\n' + content + '</tr>\n';
  }

  tablecell(content, flags) {
    const type = flags.header ? 'th' : 'td';
    const tag = flags.align
      ? '<' + type + ' align="' + flags.align + '">'
      : '<' + type + '>';
    return tag + content + '</' + type + '>\n';
  }

  // span level renderer
  strong(text) {
    return '<strong>' + text + '</strong>';
  }

  em(text) {
    return '<em>' + text + '</em>';
  }

  codespan(text) {
    return '<code>' + text + '</code>';
  }

  br() {
    return '<br>';
  }

  del(text) {
    return '<del>' + text + '</del>';
  }

  link(href, title, text) {
    href = this.options.hooks.cleanUrl(href);
    if (href === null) {
      return text;
    }
    let out = '<a href="' + this.options.hooks.escape(href) + '"';
    if (title) {
      out += ' title="' + title + '"';
    }
    out += '>' + text + '</a>';
    return out;
  }

  image(href, title, text) {
    href = this.options.hooks.cleanUrl(href);
    if (href === null) {
      return text;
    }

    let out = '<img src="' + href + '" alt="' + text + '"';
    if (title) {
      out += ' title="' + title + '"';
    }
    out += '>';
    return out;
  }

  text(text) {
    return text;
  }
};
