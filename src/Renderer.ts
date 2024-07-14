import { _defaults } from './defaults.ts';
import {
  cleanUrl,
  escape,
} from './helpers.ts';
import type { MarkedOptions } from './MarkedOptions.ts';
import type { Tokens } from './Tokens.ts';
import type { _Parser } from './Parser.ts';

/**
 * Renderer
 */
export class _Renderer {
  options: MarkedOptions;
  parser!: _Parser; // set by the parser
  constructor(options?: MarkedOptions) {
    this.options = options || _defaults;
  }

  space(token: Tokens.Space): string {
    return '';
  }

  code({ text, lang, escaped }: Tokens.Code): string {
    const langString = (lang || '').match(/^\S*/)?.[0];

    const code = text.replace(/\n$/, '') + '\n';

    if (!langString) {
      return '<pre><code>'
        + (escaped ? code : escape(code, true))
        + '</code></pre>\n';
    }

    return '<pre><code class="language-'
      + escape(langString)
      + '">'
      + (escaped ? code : escape(code, true))
      + '</code></pre>\n';
  }

  blockquote({ tokens }: Tokens.Blockquote): string {
    const body = this.parser.parse(tokens);
    return `<blockquote>\n${body}</blockquote>\n`;
  }

  html({ text }: Tokens.HTML | Tokens.Tag) : string {
    return text;
  }

  heading({ tokens, depth }: Tokens.Heading): string {
    return `<h${depth}>${this.parser.parseInline(tokens)}</h${depth}>\n`;
  }

  hr(token: Tokens.Hr): string {
    return '<hr>\n';
  }

  list(token: Tokens.List): string {
    const ordered = token.ordered;
    const start = token.start;

    let body = '';
    for (let j = 0; j < token.items.length; j++) {
      const item = token.items[j];
      body += this.listitem(item);
    }

    const type = ordered ? 'ol' : 'ul';
    const startAttr = (ordered && start !== 1) ? (' start="' + start + '"') : '';
    return '<' + type + startAttr + '>\n' + body + '</' + type + '>\n';
  }

  listitem(item: Tokens.ListItem): string {
    let itemBody = '';
    if (item.task) {
      const checkbox = this.checkbox({ checked: !!item.checked });
      if (item.loose) {
        if (item.tokens.length > 0 && item.tokens[0].type === 'paragraph') {
          item.tokens[0].text = checkbox + ' ' + item.tokens[0].text;
          if (item.tokens[0].tokens && item.tokens[0].tokens.length > 0 && item.tokens[0].tokens[0].type === 'text') {
            item.tokens[0].tokens[0].text = checkbox + ' ' + item.tokens[0].tokens[0].text;
          }
        } else {
          item.tokens.unshift({
            type: 'text',
            raw: checkbox + ' ',
            text: checkbox + ' ',
          });
        }
      } else {
        itemBody += checkbox + ' ';
      }
    }

    itemBody += this.parser.parse(item.tokens, !!item.loose);

    return `<li>${itemBody}</li>\n`;
  }

  checkbox({ checked }: Tokens.Checkbox): string {
    return '<input '
      + (checked ? 'checked="" ' : '')
      + 'disabled="" type="checkbox">';
  }

  paragraph({ tokens }: Tokens.Paragraph): string {
    return `<p>${this.parser.parseInline(tokens)}</p>\n`;
  }

  table(token: Tokens.Table): string {
    let header = '';

    // header
    let cell = '';
    for (let j = 0; j < token.header.length; j++) {
      cell += this.tablecell(token.header[j]);
    }
    header += this.tablerow({ text: cell });

    let body = '';
    for (let j = 0; j < token.rows.length; j++) {
      const row = token.rows[j];

      cell = '';
      for (let k = 0; k < row.length; k++) {
        cell += this.tablecell(row[k]);
      }

      body += this.tablerow({ text: cell });
    }
    if (body) body = `<tbody>${body}</tbody>`;

    return '<table>\n'
      + '<thead>\n'
      + header
      + '</thead>\n'
      + body
      + '</table>\n';
  }

  tablerow({ text }: Tokens.TableRow): string {
    return `<tr>\n${text}</tr>\n`;
  }

  tablecell(token: Tokens.TableCell): string {
    const content = this.parser.parseInline(token.tokens);
    const type = token.header ? 'th' : 'td';
    const tag = token.align
      ? `<${type} align="${token.align}">`
      : `<${type}>`;
    return tag + content + `</${type}>\n`;
  }

  /**
   * span level renderer
   */
  strong({ tokens }: Tokens.Strong): string {
    return `<strong>${this.parser.parseInline(tokens)}</strong>`;
  }

  em({ tokens }: Tokens.Em): string {
    return `<em>${this.parser.parseInline(tokens)}</em>`;
  }

  codespan({ text }: Tokens.Codespan): string {
    return `<code>${text}</code>`;
  }

  br(token: Tokens.Br): string {
    return '<br>';
  }

  del({ tokens }: Tokens.Del): string {
    return `<del>${this.parser.parseInline(tokens)}</del>`;
  }

  link({ href, title, tokens }: Tokens.Link): string {
    const text = this.parser.parseInline(tokens);
    const cleanHref = cleanUrl(href);
    if (cleanHref === null) {
      return text;
    }
    href = cleanHref;
    let out = '<a href="' + href + '"';
    if (title) {
      out += ' title="' + title + '"';
    }
    out += '>' + text + '</a>';
    return out;
  }

  image({ href, title, text }: Tokens.Image): string {
    const cleanHref = cleanUrl(href);
    if (cleanHref === null) {
      return text;
    }
    href = cleanHref;

    let out = `<img src="${href}" alt="${text}"`;
    if (title) {
      out += ` title="${title}"`;
    }
    out += '>';
    return out;
  }

  text(token: Tokens.Text | Tokens.Escape | Tokens.Tag) : string {
    return 'tokens' in token && token.tokens ? this.parser.parseInline(token.tokens) : token.text;
  }
}
