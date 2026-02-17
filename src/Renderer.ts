import { _defaults } from './defaults.ts';
import {
  cleanUrl,
  escapeHtmlEntities,
} from './helpers.ts';
import { other } from './rules.ts';
import type { MarkedOptions } from './MarkedOptions.ts';
import type { Tokens } from './Tokens.ts';
import type { _Parser } from './Parser.ts';

/**
 * Renderer
 */
export class _Renderer<ParserOutput = string, RendererOutput = string> {
  options: MarkedOptions<ParserOutput, RendererOutput>;
  parser!: _Parser<ParserOutput, RendererOutput>; // set by the parser
  constructor(options?: MarkedOptions<ParserOutput, RendererOutput>) {
    this.options = options || _defaults;
  }

  space(token: Tokens.Space): RendererOutput {
    return '' as RendererOutput;
  }

  code({ text, lang, escaped }: Tokens.Code): RendererOutput {
    const langString = (lang || '').match(other.notSpaceStart)?.[0];

    const code = text.replace(other.endingNewline, '') + '\n';

    if (!langString) {
      return '<pre><code>'
        + (escaped ? code : escapeHtmlEntities(code, true))
        + '</code></pre>\n' as RendererOutput;
    }

    return '<pre><code class="language-'
      + escapeHtmlEntities(langString)
      + '">'
      + (escaped ? code : escapeHtmlEntities(code, true))
      + '</code></pre>\n' as RendererOutput;
  }

  blockquote({ tokens }: Tokens.Blockquote): RendererOutput {
    const body = this.parser.parse(tokens);
    return `<blockquote>\n${body}</blockquote>\n` as RendererOutput;
  }

  html({ text }: Tokens.HTML | Tokens.Tag): RendererOutput {
    return text as RendererOutput;
  }

  def(token: Tokens.Def): RendererOutput {
    return '' as RendererOutput;
  }

  heading({ tokens, depth }: Tokens.Heading): RendererOutput {
    return `<h${depth}>${this.parser.parseInline(tokens)}</h${depth}>\n` as RendererOutput;
  }

  hr(token: Tokens.Hr): RendererOutput {
    return '<hr>\n' as RendererOutput;
  }

  list(token: Tokens.List): RendererOutput {
    const ordered = token.ordered;
    const start = token.start;

    let body = '';
    for (let j = 0; j < token.items.length; j++) {
      const item = token.items[j];
      body += this.listitem(item);
    }

    const type = ordered ? 'ol' : 'ul';
    const startAttr = (ordered && start !== 1) ? (' start="' + start + '"') : '';
    return '<' + type + startAttr + '>\n' + body + '</' + type + '>\n' as RendererOutput;
  }

  listitem(item: Tokens.ListItem): RendererOutput {
    return `<li>${this.parser.parse(item.tokens)}</li>\n` as RendererOutput;
  }

  checkbox({ checked }: Tokens.Checkbox): RendererOutput {
    return '<input '
      + (checked ? 'checked="" ' : '')
      + 'disabled="" type="checkbox"> ' as RendererOutput;
  }

  paragraph({ tokens }: Tokens.Paragraph): RendererOutput {
    return `<p>${this.parser.parseInline(tokens)}</p>\n` as RendererOutput;
  }

  table(token: Tokens.Table): RendererOutput {
    let header = '';

    // header
    let cell = '';
    for (let j = 0; j < token.header.length; j++) {
      cell += this.tablecell(token.header[j]);
    }
    header += this.tablerow({ text: cell as ParserOutput });

    let body = '';
    for (let j = 0; j < token.rows.length; j++) {
      const row = token.rows[j];

      cell = '';
      for (let k = 0; k < row.length; k++) {
        cell += this.tablecell(row[k]);
      }

      body += this.tablerow({ text: cell as ParserOutput });
    }
    if (body) body = `<tbody>${body}</tbody>`;

    return '<table>\n'
      + '<thead>\n'
      + header
      + '</thead>\n'
      + body
      + '</table>\n' as RendererOutput;
  }

  tablerow({ text }: Tokens.TableRow<ParserOutput>): RendererOutput {
    return `<tr>\n${text}</tr>\n` as RendererOutput;
  }

  tablecell(token: Tokens.TableCell): RendererOutput {
    const content = this.parser.parseInline(token.tokens);
    const type = token.header ? 'th' : 'td';
    const tag = token.align
      ? `<${type} align="${token.align}">`
      : `<${type}>`;
    return tag + content + `</${type}>\n` as RendererOutput;
  }

  /**
   * span level renderer
   */
  strong({ tokens }: Tokens.Strong): RendererOutput {
    return `<strong>${this.parser.parseInline(tokens)}</strong>` as RendererOutput;
  }

  em({ tokens }: Tokens.Em): RendererOutput {
    return `<em>${this.parser.parseInline(tokens)}</em>` as RendererOutput;
  }

  codespan({ text }: Tokens.Codespan): RendererOutput {
    return `<code>${escapeHtmlEntities(text, true)}</code>` as RendererOutput;
  }

  br(token: Tokens.Br): RendererOutput {
    return '<br>' as RendererOutput;
  }

  del({ tokens }: Tokens.Del): RendererOutput {
    return `<del>${this.parser.parseInline(tokens)}</del>` as RendererOutput;
  }

  link({ href, title, tokens }: Tokens.Link): RendererOutput {
    const text = this.parser.parseInline(tokens) as string;
    const cleanHref = cleanUrl(href);
    if (cleanHref === null) {
      return text as RendererOutput;
    }
    href = cleanHref;
    let out = '<a href="' + href + '"';
    if (title) {
      out += ' title="' + (escapeHtmlEntities(title)) + '"';
    }
    out += '>' + text + '</a>';
    return out as RendererOutput;
  }

  image({ href, title, text, tokens }: Tokens.Image): RendererOutput {
    if (tokens) {
      text = this.parser.parseInline(tokens, this.parser.textRenderer) as string;
    }
    const cleanHref = cleanUrl(href);
    if (cleanHref === null) {
      return escapeHtmlEntities(text) as RendererOutput;
    }
    href = cleanHref;

    let out = `<img src="${href}" alt="${escape(text)}"`;
    if (title) {
      out += ` title="${escapeHtmlEntities(title)}"`;
    }
    out += '>';
    return out as RendererOutput;
  }

  text(token: Tokens.Text | Tokens.Escape): RendererOutput {
    return 'tokens' in token && token.tokens
      ? this.parser.parseInline(token.tokens) as unknown as RendererOutput
      : ('escaped' in token && token.escaped ? token.text as RendererOutput : escapeHtmlEntities(token.text) as RendererOutput);
  }
}
