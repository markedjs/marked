import type { Tokens } from './Tokens.ts';

/**
 * TextRenderer
 * returns only the textual part of the token
 */
export class _TextRenderer<RendererOutput = string> {
  // no need for block level renderers
  strong({ text }: Tokens.Strong): RendererOutput {
    return text as RendererOutput;
  }

  em({ text }: Tokens.Em): RendererOutput {
    return text as RendererOutput;
  }

  codespan({ text }: Tokens.Codespan): RendererOutput {
    return text as RendererOutput;
  }

  del({ text }: Tokens.Del): RendererOutput {
    return text as RendererOutput;
  }

  html({ text }: Tokens.HTML | Tokens.Tag): RendererOutput {
    return text as RendererOutput;
  }

  text({ text }: Tokens.Text | Tokens.Escape | Tokens.Tag): RendererOutput {
    return text as RendererOutput;
  }

  link({ text }: Tokens.Link): RendererOutput {
    return '' + text as RendererOutput;
  }

  image({ text }: Tokens.Image): RendererOutput {
    return '' + text as RendererOutput;
  }

  br(): RendererOutput {
    return '' as RendererOutput;
  }
}
