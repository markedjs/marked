import type { MarkedExtension } from './MarkedOptions.ts';
import type { Tokens } from './Tokens.ts';

export const tableExtension: MarkedExtension = {
  renderer: {
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

      return '<table class="markdown-table">\n'
        + '<thead>\n'
        + header
        + '</thead>\n'
        + body
        + '</table>\n';
    },
    tablerow({ text }: Tokens.TableRow): string {
      return `<tr class="markdown-table-row">\n${text}</tr>\n`;
    },
    tablecell(token: Tokens.TableCell): string {
      const content = this.parser.parseInline(token.tokens);
      const type = token.header ? 'th' : 'td';
      const tag = token.align
        ? `<${type} align="${token.align}">`
        : `<${type}>`;
      return tag + content + `</${type}>\n`;
    },
  },
};
