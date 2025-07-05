import { _defaults } from './defaults.ts';
import {
  cleanUrl,
  escape,
} from './helpers.ts';
import { other } from './rules.ts';
import type { MarkedOptions } from './MarkedOptions.ts';
import type { Tokens } from './Tokens.ts';
import type { _Parser } from './Parser.ts';

/**
 * Renderer
 */
export class _Renderer<P = string, R = string> {
  options: MarkedOptions<P, R>;
  parser!: _Parser<P, R>; // set by the parser
  constructor(options?: MarkedOptions<P, R>) {
    this.options = options || _defaults;
  }

  space(token: Tokens.Space): R {
    return '' as R;
  }

  code({ text, lang, escaped }: Tokens.Code): R {
    const langString = (lang || '').match(other.notSpaceStart)?.[0];

    const code = text.replace(other.endingNewline, '') + '\n';

    if (!langString) {
      return '<pre><code>'
        + (escaped ? code : escape(code, true))
        + '</code></pre>\n' as R;
    }

    return '<pre><code class="language-'
      + escape(langString)
      + '">'
      + (escaped ? code : escape(code, true))
      + '</code></pre>\n' as R;
  }

  blockquote({ tokens }: Tokens.Blockquote): R {
    const body = this.parser.parse(tokens);
    return `<blockquote>\n${body}</blockquote>\n` as R;
  }

  html({ text }: Tokens.HTML | Tokens.Tag): R {
    return text as R;
  }

  heading({ tokens, depth }: Tokens.Heading): R {
    return `<h${depth}>${this.parser.parseInline(tokens)}</h${depth}>\n` as R;
  }

  hr(token: Tokens.Hr): R {
    return '<hr>\n' as R;
  }

  list(token: Tokens.List): R {
    const ordered = token.ordered;
    const start = token.start;

    let body = '';
    for (let j = 0; j < token.items.length; j++) {
      const item = token.items[j];
      body += this.listitem(item);
    }

    const type = ordered ? 'ol' : 'ul';
    const startAttr = (ordered && start !== 1) ? (' start="' + start + '"') : '';
    return '<' + type + startAttr + '>\n' + body + '</' + type + '>\n' as R;
  }

  listitem(item: Tokens.ListItem): R {
    let itemBody = '';
    if (item.task) {
      const checkbox = this.checkbox({ checked: !!item.checked });
      if (item.loose) {
        if (item.tokens[0]?.type === 'paragraph') {
          item.tokens[0].text = checkbox + ' ' + item.tokens[0].text;
          if (item.tokens[0].tokens && item.tokens[0].tokens.length > 0 && item.tokens[0].tokens[0].type === 'text') {
            item.tokens[0].tokens[0].text = checkbox + ' ' + escape(item.tokens[0].tokens[0].text);
            item.tokens[0].tokens[0].escaped = true;
          }
        } else {
          item.tokens.unshift({
            type: 'text',
            raw: checkbox + ' ',
            text: checkbox + ' ',
            escaped: true,
          });
        }
      } else {
        itemBody += checkbox + ' ';
      }
    }

    itemBody += this.parser.parse(item.tokens, !!item.loose);

    return `<li>${itemBody}</li>\n` as R;
  }

  checkbox({ checked }: Tokens.Checkbox): R {
    return '<input '
      + (checked ? 'checked="" ' : '')
      + 'disabled="" type="checkbox">' as R;
  }

  paragraph({ tokens }: Tokens.Paragraph): R {
    return `<p>${this.parser.parseInline(tokens)}</p>\n` as R;
  }

  table(token: Tokens.Table): R {
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
      + '</table>\n' as R;
  }

  tablerow({ text }: Tokens.TableRow): R {
    return `<tr>\n${text}</tr>\n` as R;
  }

  tablecell(token: Tokens.TableCell): R {
    const content = this.parser.parseInline(token.tokens);
    const type = token.header ? 'th' : 'td';
    const tag = token.align
      ? `<${type} align="${token.align}">`
      : `<${type}>`;
    return tag + content + `</${type}>\n` as R;
  }

  /**
   * span level renderer
   */
  strong({ tokens }: Tokens.Strong): R {
    return `<strong>${this.parser.parseInline(tokens)}</strong>` as R;
  }

  em({ tokens }: Tokens.Em): R {
    return `<em>${this.parser.parseInline(tokens)}</em>` as R;
  }

  codespan({ text }: Tokens.Codespan): R {
    return `<code>${escape(text, true)}</code>` as R;
  }

  br(token: Tokens.Br): R {
    return '<br>' as R;
  }

  del({ tokens }: Tokens.Del): R {
    return `<del>${this.parser.parseInline(tokens)}</del>` as R;
  }

  link({ href, title, tokens }: Tokens.Link): R {
    const text = this.parser.parseInline(tokens) as string;
    const cleanHref = cleanUrl(href);
    if (cleanHref === null) {
      return text as R;
    }
    href = cleanHref;
    let out = '<a href="' + href + '"';
    if (title) {
      out += ' title="' + (escape(title)) + '"';
    }
    out += '>' + text + '</a>';
    return out as R;
  }

  image({ href, title, text, tokens }: Tokens.Image): R {
    if (tokens) {
      text = this.parser.parseInline(tokens, this.parser.textRenderer) as string;
    }
    const cleanHref = cleanUrl(href);
    if (cleanHref === null) {
      return escape(text) as R;
    }
    href = cleanHref;

    let out = `<img src="${href}" alt="${text}"`;
    if (title) {
      out += ` title="${escape(title)}"`;
    }
    out += '>';
    return out as R;
  }

  text(token: Tokens.Text | Tokens.Escape): R {
    return 'tokens' in token && token.tokens
      ? this.parser.parseInline(token.tokens) as unknown as R
      : ('escaped' in token && token.escaped ? token.text as R : escape(token.text) as R);
  }
}
