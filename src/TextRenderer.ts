import type { Tokens } from './Tokens.ts';

/**
 * TextRenderer
 * returns only the textual part of the token
 */
export class _TextRenderer<R = string> {
  // no need for block level renderers
  strong({ text }: Tokens.Strong): R {
    return text as R;
  }

  em({ text }: Tokens.Em): R {
    return text as R;
  }

  codespan({ text }: Tokens.Codespan): R {
    return text as R;
  }

  del({ text }: Tokens.Del): R {
    return text as R;
  }

  html({ text }: Tokens.HTML | Tokens.Tag): R {
    return text as R;
  }

  text({ text }: Tokens.Text | Tokens.Escape | Tokens.Tag): R {
    return text as R;
  }

  link({ text }: Tokens.Link): R {
    return '' + text as R;
  }

  image({ text }: Tokens.Image): R {
    return '' + text as R;
  }

  br(): R {
    return '' as R;
  }
}
