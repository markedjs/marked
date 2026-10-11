import type { Tokens } from './Tokens.ts';
import type { _Parser } from './Parser.ts';

/**
 * TextRenderer
 * returns only the textual part of the token
 */
export class _TextRenderer<RendererOutput = string> {
  parser!: _Parser<unknown, RendererOutput>;
  // no need for block level renderers
  strong({ text, tokens }: Tokens.Strong): RendererOutput {
    return (tokens ? this.parser.parseInline(tokens, this) : text) as RendererOutput;
  }

  em({ text, tokens }: Tokens.Em): RendererOutput {
    return (tokens ? this.parser.parseInline(tokens, this) : text) as RendererOutput;
  }

  codespan({ text }: Tokens.Codespan): RendererOutput {
    return text as RendererOutput;
  }

  del({ text, tokens }: Tokens.Del): RendererOutput {
    return (tokens ? this.parser.parseInline(tokens, this) : text) as RendererOutput;
  }

  html({ text }: Tokens.HTML | Tokens.Tag): RendererOutput {
    return text as RendererOutput;
  }

  text({ text }: Tokens.Text | Tokens.Escape | Tokens.Tag): RendererOutput {
    return text as RendererOutput;
  }

  link({ text, tokens }: Tokens.Link): RendererOutput {
    return (tokens ? this.parser.parseInline(tokens, this) : text) as RendererOutput;
  }

  image({ text, tokens }: Tokens.Image): RendererOutput {
    return (tokens ? this.parser.parseInline(tokens, this) : text) as RendererOutput;
  }

  br(): RendererOutput {
    return '' as RendererOutput;
  }

  checkbox({ raw }: Tokens.Checkbox): RendererOutput {
    return raw as RendererOutput;
  }
}
