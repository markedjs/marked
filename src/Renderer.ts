import { _defaults } from './defaults.ts';
import {
  cleanUrl,
  escape
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

  list(body: string, ordered: boolean, start: number | ''): string {
    const type = ordered ? 'ol' : 'ul';
    const startatt = (ordered && start !== 1) ? (' start="' + start + '"') : '';
    return '<' + type + startatt + '>\n' + body + '</' + type + '>\n';
  }

  listitem(text: string, task: boolean, checked: boolean): string {
    return `<li>${text}</li>\n`;
  }

  checkbox(checked: boolean): string {
    return '<input '
      + (checked ? 'checked="" ' : '')
      + 'disabled="" type="checkbox">';
  }

  paragraph({ tokens }: Tokens.Paragraph): string {
    return `<p>${this.parser.parseInline(tokens)}</p>\n`;
  }

  table(header: string, body: string): string {
    if (body) body = `<tbody>${body}</tbody>`;

    return '<table>\n'
      + '<thead>\n'
      + header
      + '</thead>\n'
      + body
      + '</table>\n';
  }

  tablerow(content: string): string {
    return `<tr>\n${content}</tr>\n`;
  }

  tablecell(content: string, flags: {
    header: boolean;
    align: 'center' | 'left' | 'right' | null;
  }): string {
    const type = flags.header ? 'th' : 'td';
    const tag = flags.align
      ? `<${type} align="${flags.align}">`
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

  text({ text }: Tokens.Text | Tokens.Escape | Tokens.Tag) : string {
    return text;
  }
}
