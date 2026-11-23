/* eslint-disable */
import {
  Marked,
  type BlockLexerPosition,
  type BlockTokenizerPosition,
  type InlineLexerPosition,
  type InlineTokenizerPosition,
  type LexerPosition,
  type TokenizerAndRendererExtension,
  type TokenizerExtension,
  type TokenizerPosition,
} from 'marked';

const blockPos: BlockTokenizerPosition = 'beforeTable';
const inlinePos: InlineTokenizerPosition = 'afterDel';
const anyPos: TokenizerPosition = blockPos;
const anyPos2: TokenizerPosition = inlinePos;
const blockLexerPos: BlockLexerPosition = 'beforeTable';
const inlineLexerPos: InlineLexerPosition = 'beforeAutolink';
const lexerPos: LexerPosition = blockLexerPos;
const lexerPos2: LexerPosition = inlineLexerPos;
void [anyPos, anyPos2, lexerPos, lexerPos2];

// Position-only block extension (no level required)
const blockByPosition: TokenizerExtension = {
  name: 'customTable',
  position: 'beforeTable',
  tokenizer(src) {
    return { type: 'customTable', raw: src };
  },
};

// Position-only inline extension (no level required)
const inlineByPosition: TokenizerAndRendererExtension = {
  name: 'subscript',
  position: 'afterDel',
  start: (src) => src.indexOf('~'),
  tokenizer(src) {
    return { type: 'subscript', raw: src };
  },
  renderer(token) {
    return `<sub>${token.raw}</sub>`;
  },
};

// Explicit matching level + position
const matchedBlock: TokenizerExtension = {
  name: 'matchedBlock',
  level: 'block',
  position: 'afterHtml',
  tokenizer(src) {
    return { type: 'matchedBlock', raw: src };
  },
};

const matchedInline: TokenizerExtension = {
  name: 'matchedInline',
  level: 'inline',
  position: 'beforeInlineText',
  tokenizer(src) {
    return { type: 'matchedInline', raw: src };
  },
};

// Backward-compatible level-only extension
const levelOnly: TokenizerExtension = {
  name: 'levelOnly',
  level: 'block',
  tokenizer(src) {
    return { type: 'levelOnly', raw: src };
  },
};

// @ts-expect-error Either level or position is required
const missingBoth: TokenizerExtension = {
  name: 'missingBoth',
  tokenizer(src) {
    return { type: 'missingBoth', raw: src };
  },
};

// @ts-expect-error Inline position is not valid with level: 'block'
const mismatchedBlock: TokenizerExtension = {
  name: 'mismatchedBlock',
  level: 'block',
  position: 'beforeLink',
  tokenizer(src) {
    return { type: 'mismatchedBlock', raw: src };
  },
};

// @ts-expect-error Block position is not valid with level: 'inline'
const mismatchedInline: TokenizerExtension = {
  name: 'mismatchedInline',
  level: 'inline',
  position: 'beforeTable',
  tokenizer(src) {
    return { type: 'mismatchedInline', raw: src };
  },
};

const invalidPos: TokenizerExtension = {
  name: 'invalidPos',
  // @ts-expect-error Unknown position name
  position: 'beforeUnknown',
  tokenizer(src) {
    return { type: 'invalidPos', raw: src };
  },
};

const instance = new Marked({
  extensions: [blockByPosition, inlineByPosition, matchedBlock, matchedInline, levelOnly],
});
void [instance, missingBoth, mismatchedBlock, mismatchedInline, invalidPos];
