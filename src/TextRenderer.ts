import type { Tokens } from './Tokens.ts';

/**
 * TextRenderer
 * returns only the textual part of the token
 */
export class _TextRenderer {
  // no need for block level renderers
  strong({ text }: Tokens.Strong) {
    return text;
  }

  em({ text }: Tokens.Em) {
    return text;
  }

  codespan({ text }: Tokens.Codespan) {
    return text;
  }

  del({ text }: Tokens.Del) {
    return text;
  }

  html({ text }: Tokens.HTML | Tokens.Tag) {
    return text;
  }

  text({ text }: Tokens.Text | Tokens.Escape | Tokens.Tag) {
    return text;
  }

  link({ text }: Tokens.Link) {
    return '' + text;
  }

  image({ text }: Tokens.Image) {
    return '' + text;
  }

  br() {
    return '';
  }
}
