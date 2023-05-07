import { _defaults } from './defaults.ts';
import {
  cleanUrl,
  escape
} from './helpers.ts';
import type { MarkedOptions } from './MarkedOptions.ts';
import { Slugger } from './marked.ts';

/**
 * Renderer
 */
export class _Renderer {
  options: MarkedOptions;
  constructor(options?: MarkedOptions) {
    this.options = options || _defaults;
  }

  code(code: string, infostring: string | undefined, escaped: boolean): string {
    const lang = (infostring || '').match(/\S*/)![0];
    if (this.options.highlight) {
      const out = this.options.highlight(code, lang);
      if (out != null && out !== code) {
        escaped = true;
        code = out;
      }
    }

    code = code.replace(/\n$/, '') + '\n';

    if (!lang) {
      return '<pre><code>'
        + (escaped ? code : escape(code, true))
        + '</code></pre>\n';
    }

    return '<pre><code class="'
      + this.options.langPrefix
      + escape(lang)
      + '">'
      + (escaped ? code : escape(code, true))
      + '</code></pre>\n';
  }

  blockquote(quote: string): string {
    return `<blockquote>\n${quote}</blockquote>\n`;
  }

  html(html: string, block?: boolean) : string {
    return html;
  }

  heading(text: string, level: number, raw: string, slugger: Slugger): string {
    if (this.options.headerIds) {
      const id = this.options.headerPrefix + slugger.slug(raw);
      return `<h${level} id="${id}">${text}</h${level}>\n`;
    }

    // ignore IDs
    return `<h${level}>${text}</h${level}>\n`;
  }

  hr(): string {
    return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
  }

  list(body: string, ordered: boolean, start: number | ''): string {
    const type = ordered ? 'ol' : 'ul',
      startatt = (ordered && start !== 1) ? (' start="' + start + '"') : '';
    return '<' + type + startatt + '>\n' + body + '</' + type + '>\n';
  }

  listitem(text: string, task: boolean, checked: boolean): string {
    return `<li>${text}</li>\n`;
  }

  checkbox(checked: boolean): string {
    return '<input '
      + (checked ? 'checked="" ' : '')
      + 'disabled="" type="checkbox"'
      + (this.options.xhtml ? ' /' : '')
      + '> ';
  }

  paragraph(text: string): string {
    return `<p>${text}</p>\n`;
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
  strong(text: string): string {
    return `<strong>${text}</strong>`;
  }

  em(text: string): string {
    return `<em>${text}</em>`;
  }

  codespan(text: string): string {
    return `<code>${text}</code>`;
  }

  br(): string {
    return this.options.xhtml ? '<br/>' : '<br>';
  }

  del(text: string): string {
    return `<del>${text}</del>`;
  }

  link(href: string, title: string | null | undefined, text: string): string {
    href = cleanUrl(this.options.sanitize, this.options.baseUrl, href) as any;
    if (href === null) {
      return text;
    }
    let out = '<a href="' + href + '"';
    if (title) {
      out += ' title="' + title + '"';
    }
    out += '>' + text + '</a>';
    return out;
  }

  image(href: string, title: string | null, text: string): string {
    href = cleanUrl(this.options.sanitize, this.options.baseUrl, href) as any;
    if (href === null) {
      return text;
    }

    let out = `<img src="${href}" alt="${text}"`;
    if (title) {
      out += ` title="${title}"`;
    }
    out += this.options.xhtml ? '/>' : '>';
    return out;
  }

  text(text: string) : string {
    return text;
  }
}
