import { marked, Marked } from 'marked';
import type { MarkedExtension } from 'marked';

// Compile against the public declarations, including contextual token typing.
const extension: MarkedExtension = {
  async: true,
  walkTokens(token) {
    return [
      Promise.resolve().then(() => {
        if (token.type === 'text') {
          token.text = token.text.toUpperCase();
        }
      }),
      undefined,
    ];
  },
};

marked.use(extension);
const parser = new Marked(extension);
parser.use({
  async: true,
  walkTokens(token) {
    return [Promise.resolve().then(() => {
      token.raw = token.raw.trim();
    })];
  },
});

marked.use({ walkTokens: () => [] });
marked.use({ walkTokens: () => undefined });
marked.use({ walkTokens: () => Promise.resolve() });

const block: Promise<string> = marked.parse('text', { async: true });
const inline: Promise<string> = parser.parseInline('text', { async: true });
await Promise.all([block, inline]);
