/* eslint-disable */
import { Marked, type MarkedExtension, type Tokens } from 'marked';

const extension: MarkedExtension<number[], number> = {
  tokenizer: {
    paragraph(src): Tokens.Paragraph | undefined {
      const paragraph: Tokens.Paragraph = {
        type: 'paragraph', raw: src, text: src, tokens: [],
      };
      const output: number = this.options.renderer!.paragraph(paragraph);
      const parsed: number[] = this.options.hooks!.postprocess([output]);
      // @ts-expect-error The custom renderer does not return a string.
      const html: string = this.options.renderer!.paragraph(paragraph);
      void [parsed, html];
      return undefined;
    },
  },
};

const customOutput = new Marked<number[], number>(extension);
customOutput.use(extension);
customOutput.use({
  tokenizer: {
    text(src) {
      const output: number = this.options.renderer!.text({
        type: 'text', raw: src, text: src,
      });
      void output;
      return false;
    },
  },
});

new Marked().use({
  tokenizer: {
    paragraph(src) {
      const output: string = this.options.renderer!.paragraph({
        type: 'paragraph', raw: src, text: src, tokens: [],
      });
      // @ts-expect-error Default renderers still return strings.
      const numeric: number = output;
      void numeric;
      return false;
    },
  },
});
