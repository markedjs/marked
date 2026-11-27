import { _Tokenizer } from './Tokenizer.ts';
import { _defaults } from './defaults.ts';
import { other, block, inline } from './rules.ts';
import {
  beginEmStrongDelCloserScan,
  cachedLastPossibleDelCloserIndex,
  cachedLastPossibleEmStrongCloserIndex,
  endEmStrongDelCloserScan,
  normalizeLabel,
  type EmStrongDelCloserHintFrame,
} from './helpers.ts';
import type { Token, TokensList, Tokens } from './Tokens.ts';
import type { MarkedOptions } from './MarkedOptions.ts';

/**
 * Block Lexer
 */
export class _Lexer<ParserOutput = string, RendererOutput = string> {
  tokens: TokensList;
  options: MarkedOptions<ParserOutput, RendererOutput>;
  state: {
    inLink: boolean;
    inRawBlock: boolean;
    /** a link was produced in the inline run currently being scanned */
    linkEmitted: boolean;
    /**
     * false while scanning an inline run whose source contains no ')',
     * letting Tokenizer.link bail out before its quadratic backtracking.
     * Anchored once per run by inlineTokens.
     */
    linkParenPossible: boolean;
    top: boolean;
    /** lexing the content of a block quote, whose nested markers the outermost one has expanded */
    inBlockquote: boolean;
    /** the last block token lexed in the current block run, so a tokenizer can check the token before it */
    lastToken?: Token;
  };

  public inlineQueue: { src: string, tokens: Token[] }[];

  private tokenizer: _Tokenizer<ParserOutput, RendererOutput>;

  constructor(options?: MarkedOptions<ParserOutput, RendererOutput>) {
    // TokenList cannot be created in one go
    this.tokens = [] as unknown as TokensList;
    this.tokens.links = Object.create(null);
    this.options = options || _defaults;
    this.options.tokenizer = this.options.tokenizer || new _Tokenizer<ParserOutput, RendererOutput>();
    this.tokenizer = this.options.tokenizer;
    this.tokenizer.options = this.options;
    this.tokenizer.lexer = this;
    this.inlineQueue = [];
    this.state = {
      inLink: false,
      inRawBlock: false,
      linkEmitted: false,
      linkParenPossible: true,
      top: true,
      inBlockquote: false,
    };

    const rules = {
      other,
      block: block.normal,
      inline: inline.normal,
    };

    if (this.options.pedantic) {
      rules.block = block.pedantic;
      rules.inline = inline.pedantic;
    } else if (this.options.gfm) {
      rules.block = block.gfm;
      if (this.options.breaks) {
        rules.inline = inline.breaks;
      } else {
        rules.inline = inline.gfm;
      }
    }
    this.tokenizer.rules = rules;
  }

  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block,
      inline,
    };
  }

  /**
   * Static Lex Method
   */
  static lex<ParserOutput = string, RendererOutput = string>(src: string, options?: MarkedOptions<ParserOutput, RendererOutput>) {
    const lexer = new _Lexer<ParserOutput, RendererOutput>(options);
    return lexer.lex(src);
  }

  /**
   * Static Lex Inline Method
   */
  static lexInline<ParserOutput = string, RendererOutput = string>(src: string, options?: MarkedOptions<ParserOutput, RendererOutput>) {
    const lexer = new _Lexer<ParserOutput, RendererOutput>(options);
    return lexer.inlineTokens(src);
  }

  /**
   * Preprocessing
   */
  lex(src: string) {
    src = src.replace(other.carriageReturn, '\n');

    this.blockTokens(src, this.tokens);

    for (let i = 0; i < this.inlineQueue.length; i++) {
      const next = this.inlineQueue[i];
      // an inline <pre>, <code>, <kbd> or <script> left open ends with the block
      // holding it; carried over, it would stop every later block's text from
      // being escaped
      this.state.inRawBlock = false;
      this.inlineTokens(next.src, next.tokens);
    }
    this.inlineQueue = [];

    return this.tokens;
  }

  /**
   * Lexing
   */
  blockTokens(src: string, tokens?: Token[], lastParagraphClipped?: boolean): Token[];
  blockTokens(src: string, tokens?: TokensList, lastParagraphClipped?: boolean): TokensList;
  blockTokens(src: string, tokens: Token[] = [], lastParagraphClipped = false) {
    this.tokenizer.lexer = this;
    // list items and block quotes lex their contents with a nested call, so
    // restore the outer last token when it returns
    const outerLastToken = this.state.lastToken;
    if (this.options.pedantic) {
      src = src.replace(other.tabCharGlobal, '    ').replace(other.spaceLine, '');
    }

    let srcLength = Infinity;
    let lastParagraph: Token | undefined;
    const mergeAdjacentParagraphs = this.options.gfm && !this.options.pedantic
      && this.tokenizer.paragraph === _Tokenizer.prototype.paragraph;
    while (src) {
      if (src.length < srcLength) {
        srcLength = src.length;
      } else {
        this.infiniteLoopError(src.charCodeAt(0));
        break;
      }

      this.state.lastToken = tokens.at(-1);
      let token: Tokens.Generic | undefined;

      if (this.options.extensions?.block?.some((extTokenizer) => {
        if (token = extTokenizer.call({ lexer: this }, src, tokens)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          return true;
        }
        return false;
      })) {
        continue;
      }

      // newline
      if (token = this.tokenizer.space(src)) {
        src = src.substring(token.raw.length);
        const lastToken = tokens.at(-1);
        if (token.raw.length === 1 && lastToken !== undefined) {
          // if there's a single \n as a spacer, it's terminating the last line,
          // so move it there so that we don't get unnecessary paragraph tags
          lastToken.raw += '\n';
        } else {
          tokens.push(token);
        }
        continue;
      }

      // code
      if (token = this.tokenizer.code(src)) {
        src = src.substring(token.raw.length);
        const lastToken = tokens.at(-1);
        // An indented code block cannot interrupt a paragraph.
        if (lastToken?.type === 'paragraph' || lastToken?.type === 'text') {
          lastToken.raw += (lastToken.raw.endsWith('\n') ? '' : '\n') + token.raw;
          lastToken.text += '\n' + token.text;
          this.inlineQueue.at(-1)!.src = lastToken.text;
        } else {
          tokens.push(token);
        }
        continue;
      }

      // fences
      if (token = this.tokenizer.fences(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // heading
      if (token = this.tokenizer.heading(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // hr
      if (token = this.tokenizer.hr(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // blockquote
      if (token = this.tokenizer.blockquote(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // list
      if (token = this.tokenizer.list(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // html
      if (token = this.tokenizer.html(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // def
      if (token = this.tokenizer.def(src)) {
        src = src.substring(token.raw.length);
        const lastToken = tokens.at(-1);
        if (lastToken?.type === 'paragraph' || lastToken?.type === 'text') {
          lastToken.raw += (lastToken.raw.endsWith('\n') ? '' : '\n') + token.raw;
          lastToken.text += '\n' + token.raw;
          this.inlineQueue.at(-1)!.src = lastToken.text;
        } else {
          // The first definition of a label wins, but a later one still consumes its text
          if (!this.tokens.links[token.tag]) {
            this.tokens.links[token.tag] = {
              href: token.href,
              title: token.title,
            };
          }
          tokens.push(token);
        }
        continue;
      }

      // table (gfm)
      if (token = this.tokenizer.table(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // lheading
      if (token = this.tokenizer.lheading(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // top-level paragraph
      // prevent paragraph consuming extensions by clipping 'src' to extension start
      let cutSrc = src;
      if (this.options.extensions?.startBlock) {
        let startIndex = Infinity;
        const tempSrc = src.slice(1);
        let tempStart;
        this.options.extensions.startBlock.forEach((getStartIndex) => {
          tempStart = getStartIndex.call({ lexer: this }, tempSrc);
          if (typeof tempStart === 'number' && tempStart >= 0) {
            startIndex = Math.min(startIndex, tempStart);
          }
        });
        if (startIndex < Infinity && startIndex >= 0) {
          cutSrc = src.substring(0, startIndex + 1);
        }
      }
      if (this.state.top && (token = this.tokenizer.paragraph(cutSrc))) {
        const lastToken = tokens.at(-1);
        // A table-shaped header rejected by the table tokenizer is still
        // paragraph continuation, not a new block. Keep custom paragraph
        // tokenizers' choice to emit separate paragraphs unchanged.
        if ((lastParagraphClipped || (lastToken === lastParagraph && mergeAdjacentParagraphs)) && lastToken?.type === 'paragraph') {
          lastToken.raw += (lastToken.raw.endsWith('\n') ? '' : '\n') + token.raw;
          lastToken.text += '\n' + token.text;
          this.inlineQueue.pop();
          this.inlineQueue.at(-1)!.src = lastToken.text;
          lastParagraph = lastToken;
        } else {
          tokens.push(token);
          lastParagraph = token;
        }
        lastParagraphClipped = cutSrc.length !== src.length;
        src = src.substring(token.raw.length);
        continue;
      }

      // text
      if (token = this.tokenizer.text(src)) {
        src = src.substring(token.raw.length);
        const lastToken = tokens.at(-1);
        if (lastToken?.type === 'text') {
          lastToken.raw += (lastToken.raw.endsWith('\n') ? '' : '\n') + token.raw;
          lastToken.text += '\n' + token.text;
          this.inlineQueue.pop();
          this.inlineQueue.at(-1)!.src = lastToken.text;
        } else {
          tokens.push(token);
        }
        continue;
      }

      if (src) {
        this.infiniteLoopError(src.charCodeAt(0));
        break;
      }
    }

    this.state.top = true;
    this.state.lastToken = outerLastToken;
    return tokens;
  }

  inline(src: string, tokens: Token[] = []) {
    this.inlineQueue.push({ src, tokens });
    return tokens;
  }

  /**
   * Does this link text hold a link already? An image does not count: an image
   * may hold a link, a link may not.
   */
  private linkInText(text: string): boolean {
    if (!text.includes('[')) {
      return false;
    }

    const linkRule = this.tokenizer.rules.inline.link;
    for (const match of text.matchAll(this.tokenizer.rules.inline.blockSkip)) {
      // blockSkip also matches code spans and html, and the `!` of an image is
      // left out of the match, so read the character before it.
      if (linkRule.test(match[0]) && text.charAt(match.index - 1) !== '!') {
        return true;
      }
    }

    for (const match of text.matchAll(this.tokenizer.rules.inline.reflinkSearch)) {
      const match0 = match[0];
      const refStart = match0.lastIndexOf('[');
      if (match0.charAt(0) === '!' || !Object.hasOwn(this.tokens.links, normalizeLabel(match0.slice(refStart + 1, -1)))) {
        continue;
      }
      // a candidate holding a link is not a link either, so it does not count
      if (refStart > 1 && this.linkInText(match0.slice(1, refStart - 1))) {
        continue;
      }
      return true;
    }

    return false;
  }

  /**
   * Lexing/Compiling
   */
  inlineTokens(src: string, tokens: Token[] = []): Token[] {
    this.tokenizer.lexer = this;
    // One paren scan per inline run, shared with Tokenizer.link: without a
    // ')' ahead the link regex cannot match, and skipping it avoids its
    // quadratic backtracking over unterminated-link inputs like
    // `'[a](b'.repeat(n)`. Extension tokenizers can pass generated text to
    // nested runs, so each run must check its own source.
    const prevLinkParenPossible = this.state.linkParenPossible;
    const firstParen = src.indexOf(')');
    this.state.linkParenPossible = firstParen !== -1;
    try {
      return this.#inlineTokensInner(src, tokens, firstParen);
    } finally {
      // Restore the outer run's flag for the rest of its loop.
      this.state.linkParenPossible = prevLinkParenPossible;
    }
  }

  #inlineTokensInner(src: string, tokens: Token[], firstParen: number): Token[] {
    // The masked source is only read by emStrong and del, which need a *, _ or
    // ~ to start. Skip building it for a run without one, unless a custom
    // tokenizer or an emStrongMask hook may read it.
    const hasDelimiter = src.includes('*') || src.includes('_') || src.includes('~');
    const maskedSrc = hasDelimiter
      || this.options.hooks?.emStrongMask
      || this.tokenizer.emStrong !== _Tokenizer.prototype.emStrong
      || this.tokenizer.del !== _Tokenizer.prototype.del
      ? this.#maskSrc(src)
      : src;

    // Without a delimiter no opener can match, so nothing reads the closer scan.
    if (!hasDelimiter) {
      return this.#tokenizeInlines(src, maskedSrc, tokens, null, firstParen);
    }

    // One scan of this maskedSrc for the last emphasis, strong, and
    // strikethrough closers, shared by every opener in the pass. Popped
    // when the pass ends so the source is not retained (#4099).
    const hintFrame = beginEmStrongDelCloserScan(this.tokenizer, maskedSrc);
    try {
      return this.#tokenizeInlines(src, maskedSrc, tokens, hintFrame, firstParen);
    } finally {
      endEmStrongDelCloserScan(this.tokenizer);
    }
  }

  #tokenizeInlines(
    rootSrc: string,
    rootMaskedSrc: string,
    rootTokens: Token[],
    rootHintFrame: EmStrongDelCloserHintFrame | null,
    firstParen: number,
  ): Token[] {
    interface InlineFrame {
      src: string;
      maskedSrc: string;
      tokens: Token[];
      prevChar: string;
      keepPrevChar: boolean;
      srcLength: number;
      rootOffset: number;
      nextParen: number;
      ownsCloserFrame: boolean;
      prevLinkParenPossible: boolean;
      hintFrame: EmStrongDelCloserHintFrame | null;
      subMaskedSrc: string;
      subStart: number;
      subEnd: number;
      subLastAst: number;
      subLastUnd: number;
      subLastDel: number;
    }

    const canDeferEmStrong = rootHintFrame !== null && this.tokenizer.emStrong === _Tokenizer.prototype.emStrong;
    const canDeferDel = rootHintFrame !== null && this.tokenizer.del === _Tokenizer.prototype.del;
    const canReuseMask = !this.options.hooks?.emStrongMask;

    let src = rootSrc;
    let maskedSrc = rootMaskedSrc;
    let tokens = rootTokens;
    let hintFrame = rootHintFrame;
    let keepPrevChar = false;
    let prevChar = '';
    let srcLength = Infinity;
    let rootOffset = 0;
    let nextParen = firstParen;
    let ownsCloserFrame = false;
    let subLastAst = -2;
    let subLastUnd = -2;
    let subLastDel = -2;
    let stack: InlineFrame[] | undefined;
    let extraCloserFrames = 0;
    let pushedChild = false;

    const scanSliceLastCloser = (slice: string, delim: '*' | '_' | '~'): number => {
      for (let i = slice.length - 1; i >= 0; i--) {
        if (slice[i] !== delim) {
          continue;
        }
        let start = i;
        while (start > 0 && slice[start - 1] === delim) {
          start--;
        }
        const prev = start === 0 ? '\n' : slice[start - 1];
        if (prev !== ' ' && prev !== '\t' && prev !== '\n' && prev !== '\r' && prev !== '\f') {
          return start;
        }
        i = start;
      }
      return -1;
    };

    try {
      while (true) {
        while (src) {
          if (src.length < srcLength) {
            srcLength = src.length;
          } else {
            this.infiniteLoopError(src.charCodeAt(0));
            break;
          }

          if (!keepPrevChar) {
            prevChar = '';
          }
          keepPrevChar = false;

          let token: Tokens.Generic | undefined;

          // extensions
          if (this.options.extensions?.inline?.some((extTokenizer) => {
            if (token = extTokenizer.call({ lexer: this }, src, tokens)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              return true;
            }
            return false;
          })) {
            continue;
          }

          // escape
          if (token = this.tokenizer.escape(src)) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            continue;
          }

          // tag
          if (token = this.tokenizer.tag(src)) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            continue;
          }

          // link
          if (token = this.tokenizer.link(src)) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            continue;
          }

          // reflink, nolink
          if (token = this.tokenizer.reflink(src, this.tokens.links)) {
            src = src.substring(token.raw.length);
            const lastToken = tokens.at(-1);
            if (token.type === 'text' && lastToken?.type === 'text') {
              lastToken.raw += token.raw;
              lastToken.text += token.text;
            } else {
              tokens.push(token);
            }
            continue;
          }

          // #4099 follow-up: for a run of `*`, `_`, or `~` with no possible closer
          // anywhere ahead in maskedSrc, every opener position fails identically
          // and the outer loop walks the run char-by-char, giving O(n^2) time.
          // Consume the whole run as literal text in one step.
          const firstChar = src[0];
          if (firstChar === '*' || firstChar === '_' || firstChar === '~') {
            const pos = maskedSrc.length - src.length;
            let lastCloser = firstChar === '~'
              ? cachedLastPossibleDelCloserIndex(this.tokenizer, maskedSrc)
              : cachedLastPossibleEmStrongCloserIndex(this.tokenizer, maskedSrc, firstChar);
            if (lastCloser >= maskedSrc.length) {
              if (firstChar === '*') {
                if (subLastAst === -2) subLastAst = scanSliceLastCloser(maskedSrc, '*');
                lastCloser = subLastAst;
              } else if (firstChar === '_') {
                if (subLastUnd === -2) subLastUnd = scanSliceLastCloser(maskedSrc, '_');
                lastCloser = subLastUnd;
              } else {
                if (subLastDel === -2) subLastDel = scanSliceLastCloser(maskedSrc, '~');
                lastCloser = subLastDel;
              }
            }
            if (lastCloser <= pos) {
              const code = firstChar.charCodeAt(0);
              let runEnd = 1;
              while (runEnd < src.length && src.charCodeAt(runEnd) === code) runEnd++;
              const raw = src.substring(0, runEnd);
              const lastToken = tokens.at(-1);
              if (lastToken?.type === 'text' && !lastToken.escaped) {
                lastToken.raw += raw;
                lastToken.text += raw;
              } else {
                tokens.push({ type: 'text', raw, text: raw, escaped: false } as Tokens.Text);
              }
              src = src.substring(runEnd);
              prevChar = firstChar;
              keepPrevChar = true;
              continue;
            }
          }

          // em & strong
          if (canDeferEmStrong && hintFrame) {
            hintFrame.deferInline = true;
            hintFrame.deferred = false;
            token = this.tokenizer.emStrong(src, maskedSrc, prevChar);
            hintFrame.deferInline = false;
          } else {
            token = this.tokenizer.emStrong(src, maskedSrc, prevChar);
          }
          if (!token) {
            // code
            if (token = this.tokenizer.codespan(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            }

            // br
            if (token = this.tokenizer.br(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            }

            // del (gfm)
            if (canDeferDel && hintFrame) {
              hintFrame.deferInline = true;
              hintFrame.deferred = false;
              token = this.tokenizer.del(src, maskedSrc, prevChar);
              hintFrame.deferInline = false;
            } else {
              token = this.tokenizer.del(src, maskedSrc, prevChar);
            }
          }

          if (token) {
            const posInFrame = maskedSrc.length - src.length;
            src = src.substring(token.raw.length);
            tokens.push(token);
            if (hintFrame?.deferred) {
              hintFrame.deferred = false;
              stack ??= [];
              stack.push({
                src,
                maskedSrc,
                tokens,
                prevChar,
                keepPrevChar,
                srcLength,
                rootOffset,
                nextParen,
                ownsCloserFrame,
                prevLinkParenPossible: this.state.linkParenPossible,
                hintFrame,
                subMaskedSrc: hintFrame.subMaskedSrc,
                subStart: hintFrame.subStart,
                subEnd: hintFrame.subEnd,
                subLastAst,
                subLastUnd,
                subLastDel,
              });
              const childText = token.text as string;
              const delimLen = (token.raw.length - childText.length) >> 1;
              src = childText;
              tokens = token.tokens!;
              prevChar = '';
              keepPrevChar = false;
              srcLength = Infinity;
              subLastAst = -2;
              subLastUnd = -2;
              subLastDel = -2;
              if (canReuseMask && rootOffset !== -1) {
                const childStart = rootOffset + posInFrame + delimLen;
                const childEnd = childStart + childText.length;
                maskedSrc = maskedSrc.slice(posInFrame + delimLen, posInFrame + token.raw.length - delimLen);
                rootOffset = childStart;
                ownsCloserFrame = false;
                hintFrame.subMaskedSrc = maskedSrc;
                hintFrame.subStart = childStart;
                hintFrame.subEnd = childEnd;
                if (nextParen === -1) {
                  this.state.linkParenPossible = false;
                } else {
                  if (nextParen < childStart) {
                    nextParen = rootSrc.indexOf(')', childStart);
                  }
                  this.state.linkParenPossible = nextParen !== -1 && nextParen < childEnd;
                }
              } else {
                maskedSrc = this.#maskSrc(childText);
                rootOffset = -1;
                const childParen = childText.indexOf(')');
                nextParen = childParen;
                this.state.linkParenPossible = childParen !== -1;
                hintFrame = beginEmStrongDelCloserScan(this.tokenizer, maskedSrc);
                ownsCloserFrame = true;
                extraCloserFrames++;
              }
              pushedChild = true;
              break;
            }
            continue;
          }

          // autolink
          if (token = this.tokenizer.autolink(src)) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            continue;
          }

          // url (gfm)
          if (!this.state.inLink && (token = this.tokenizer.url(src))) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            continue;
          }

          // text
          // prevent inlineText consuming extensions by clipping 'src' to extension start
          let cutSrc = src;
          if (this.options.extensions?.startInline) {
            let startIndex = Infinity;
            const tempSrc = src.slice(1);
            let tempStart;
            this.options.extensions.startInline.forEach((getStartIndex) => {
              tempStart = getStartIndex.call({ lexer: this }, tempSrc);
              if (typeof tempStart === 'number' && tempStart >= 0) {
                startIndex = Math.min(startIndex, tempStart);
              }
            });
            if (startIndex < Infinity && startIndex >= 0) {
              cutSrc = src.substring(0, startIndex + 1);
            }
          }
          if (token = this.tokenizer.inlineText(cutSrc)) {
            src = src.substring(token.raw.length);
            if (token.raw.slice(-1) !== '_') { // Track prevChar before string of ____ started
              prevChar = token.raw.slice(-1);
            }
            keepPrevChar = true;
            const lastToken = tokens.at(-1);
            if (lastToken?.type === 'text') {
              lastToken.raw += token.raw;
              lastToken.text += token.text;
            } else {
              tokens.push(token);
            }
            continue;
          }

          if (src) {
            this.infiniteLoopError(src.charCodeAt(0));
            break;
          }
        }

        if (pushedChild) {
          pushedChild = false;
          continue;
        }

        if (!stack || stack.length === 0) {
          break;
        }
        if (ownsCloserFrame) {
          endEmStrongDelCloserScan(this.tokenizer);
          extraCloserFrames--;
        }
        const parent = stack.pop()!;
        src = parent.src;
        maskedSrc = parent.maskedSrc;
        tokens = parent.tokens;
        prevChar = parent.prevChar;
        keepPrevChar = parent.keepPrevChar;
        srcLength = parent.srcLength;
        rootOffset = parent.rootOffset;
        nextParen = parent.nextParen;
        ownsCloserFrame = parent.ownsCloserFrame;
        this.state.linkParenPossible = parent.prevLinkParenPossible;
        hintFrame = parent.hintFrame;
        if (hintFrame) {
          hintFrame.subMaskedSrc = parent.subMaskedSrc;
          hintFrame.subStart = parent.subStart;
          hintFrame.subEnd = parent.subEnd;
        }
        subLastAst = parent.subLastAst;
        subLastUnd = parent.subLastUnd;
        subLastDel = parent.subLastDel;
      }
    } finally {
      while (extraCloserFrames-- > 0) {
        endEmStrongDelCloserScan(this.tokenizer);
      }
    }

    return rootTokens;
  }

  /**
   * Mask links, code spans, raw html and autolinks. blockSkip finds every
   * `<...>` run, but only real raw html and autolinks take precedence over
   * emphasis: other text in angle brackets, like `<*name*>`, stays unmasked so
   * emphasis can open and close in it. A tag may also run past the first `>`,
   * as in `<a title=">">`, so mask the whole tag.
   */
  #maskBlocks(src: string): string {
    const { blockSkip, tag, autolink } = this.tokenizer.rules.inline;
    let masked = '';
    let last = 0;
    let match: RegExpExecArray | null;
    blockSkip.lastIndex = 0;
    while ((match = blockSkip.exec(src))) {
      const start = match.index + (match[2] ? match[2].length : 0);
      let end = match.index + match[0].length;
      if (src.charAt(start) === '<') {
        const rest = src.slice(start);
        const html = tag.exec(rest) || autolink.exec(rest);
        if (!html) {
          blockSkip.lastIndex = start + 1;
          continue;
        }
        end = start + html[0].length;
        blockSkip.lastIndex = end;
      }
      masked += src.slice(last, start) + '[' + 'a'.repeat(end - start - 2) + ']';
      last = end;
    }
    return masked + src.slice(last);
  }

  /**
   * Mask links, code, html and escapes so emStrong and del do not see their
   * delimiters inside them.
   */
  #maskSrc(src: string): string {
    // String with links masked to avoid interference with em and strong
    let maskedSrc = src;

    // Mask out reflinks
    if (this.tokens.links && src.includes('[')) {
      const reflinkSearch = this.tokenizer.rules.inline.reflinkSearch;
      const maskReflink = (match0: string): string => {
        const refStart = match0.lastIndexOf('[');
        if (!Object.hasOwn(this.tokens.links, normalizeLabel(match0.slice(refStart + 1, -1)))) {
          return match0;
        }
        // CommonMark: "Links may not contain other links, at any level of
        // nesting." A candidate whose text already holds one never becomes a
        // link, so flattening the whole span would hide the emphasis that
        // does still apply inside it. Mask the links it holds instead.
        // Images are exempt: their text is flattened into an alt attribute.
        if (refStart > 1 && match0.charAt(0) !== '!') {
          const text = match0.slice(1, refStart - 1);
          if (this.linkInText(text)) {
            return '[' + text.replace(reflinkSearch, maskReflink)
              + '][' + 'a'.repeat(match0.length - refStart - 2) + ']';
          }
        }
        return '[' + 'a'.repeat(match0.length - 2) + ']';
      };
      maskedSrc = maskedSrc.replace(reflinkSearch, maskReflink);
    }

    // Mask out escaped characters.
    // Every mask must keep the length it replaces: emStrong and del line
    // maskedSrc up with src by slicing from the end. `anyPunctuation` matches
    // unicode punctuation, so an escaped astral character is 3 code units.
    // A backslash inside a code span is literal, not an escape. Mask the
    // backticks inside the span instead, so blockSkip still skips all of it.
    maskedSrc = maskedSrc.replace(this.tokenizer.rules.inline.anyPunctuationOutsideCode, (match0, code, punct) => {
      if (punct) {
        return '+'.repeat(match0.length);
      }
      if (code) {
        return code + match0.slice(code.length, -code.length).replace(/`/g, '+') + code;
      }
      return match0;
    });

    // Mask out other blocks
    maskedSrc = this.#maskBlocks(maskedSrc);

    // Mask out blocks from extensions
    maskedSrc = this.options.hooks?.emStrongMask?.call({ lexer: this }, maskedSrc) ?? maskedSrc;

    return maskedSrc;
  }

  private infiniteLoopError(byte: number) {
    const errMsg = 'Infinite loop on byte: ' + byte;
    if (this.options.silent) {
      console.error(errMsg);
    } else {
      throw new Error(errMsg);
    }
  }
}
