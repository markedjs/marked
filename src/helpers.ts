import { other } from './rules.ts';

/**
 * Helpers
 */
const escapeReplacements: { [index: string]: string } = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
const getEscapeReplacement = (ch: string) => escapeReplacements[ch];

export function escapeHtmlEntities(html: string, encode?: boolean) {
  if (encode) {
    if (other.escapeTest.test(html)) {
      return html.replace(other.escapeReplace, getEscapeReplacement);
    }
  } else {
    if (other.escapeTestNoEncode.test(html)) {
      return html.replace(other.escapeReplaceNoEncode, getEscapeReplacement);
    }
  }

  return html;
}

/**
 * Numeric character references are recognized outside code and are equivalent to the
 * character they name. Values that are zero, out of range, or a surrogate become the
 * replacement character.
 */
export function decodeNumericCharacterReferences(text: string) {
  if (!other.numericCharacterReference.test(text)) {
    return text;
  }
  // A decoded character must not join its neighbours into a new reference,
  // so every `&` that is not already one is escaped here.
  return text.replace(other.numericCharacterReferenceOrAmpersand, (ref: string, dec?: string, hex?: string) => {
    if (dec === undefined && hex === undefined) {
      return '&amp;';
    }
    const code = dec === undefined ? Number.parseInt(hex!, 16) : Number.parseInt(dec, 10);
    if (code === 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) {
      return '�';
    }
    return code === 38 ? '&amp;' : String.fromCodePoint(code);
  });
}

export function cleanUrl(href: string) {
  try {
    href = encodeURI(href).replace(other.percentDecode, '%');
  } catch {
    return null;
  }
  return href;
}

export function splitCells(tableRow: string, count?: number) {
  // ensure that every cell-delimiting pipe has a space
  // before it to distinguish it from an escaped pipe
  const row = tableRow.replace(other.findPipe, (match, offset, str) => {
      let escaped = false;
      let curr = offset;
      while (--curr >= 0 && str[curr] === '\\') escaped = !escaped;
      if (escaped) {
        // odd number of slashes means | is escaped
        // so we leave it alone
        return '|';
      } else {
        // add space before unescaped |
        return ' |';
      }
    }),
    cells = row.split(other.splitPipe);
  let i = 0;

  // First/last cell in a row cannot be empty if it has no leading/trailing pipe
  if (!cells[0].trim()) {
    cells.shift();
  }
  if (cells.length > 0 && !cells.at(-1)?.trim()) {
    cells.pop();
  }

  if (count) {
    if (cells.length > count) {
      cells.splice(count);
    } else {
      while (cells.length < count) cells.push('');
    }
  }

  for (; i < cells.length; i++) {
    // leading or trailing whitespace is ignored per the gfm spec
    cells[i] = cells[i].trim().replace(other.slashPipe, '|');
  }
  return cells;
}

/**
 * Remove trailing 'c's. Equivalent to str.replace(/c*$/, '').
 * /c*$/ is vulnerable to REDOS.
 *
 * @param str
 * @param c
 * @param invert Remove suffix of non-c chars instead. Default falsey.
 */
export function rtrim(str: string, c: string, invert?: boolean) {
  const l = str.length;
  if (l === 0) {
    return '';
  }

  // Length of suffix matching the invert condition.
  let suffLen = 0;

  // Step left until we fail to match the invert condition.
  while (suffLen < l) {
    const currChar = str.charAt(l - suffLen - 1);
    if (currChar === c && !invert) {
      suffLen++;
    } else if (currChar !== c && invert) {
      suffLen++;
    } else {
      break;
    }
  }

  return str.slice(0, l - suffLen);
}

export function trimTrailingBlankLines(str: string) {
  const lines = str.split('\n');
  let end = lines.length - 1;
  while (end >= 0 && other.blankLine.test(lines[end])) {
    end--;
  }
  if (lines.length - end <= 2) {
    // we want to keep single trailing blank lines
    return str;
  }

  return lines.slice(0, end + 1).join('\n');
}

/**
 * Normalizes a link label so definitions and references can be matched.
 * CommonMark asks for a Unicode case fold, which `toLowerCase()` does not
 * reach: `ẞ` lowercases to `ß` and so never meets `SS`. Round-tripping
 * through upper case does, as in commonmark.js; the final `toLowerCase()`
 * keeps the folded label lower case, the form `def.tag` has always used.
 */
export function normalizeLabel(label: string) {
  // The spec also asks for leading and trailing spaces, tabs and line endings
  // to be stripped, and for internal runs of them to collapse to one space.
  // Doing it here keeps every call site in agreement: the definition and the
  // reference have to normalize to the same key.
  return label.trim().replace(other.multipleSpaceGlobal, ' ').toLowerCase().toUpperCase().toLowerCase();
}

export function findClosingBracket(str: string, b: string) {
  // an opening bracket on its own is still unbalanced, so both have to be absent
  if (str.indexOf(b[0]) === -1 && str.indexOf(b[1]) === -1) {
    return -1;
  }

  let level = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\\') {
      i++;
    } else if (str[i] === b[0]) {
      level++;
    } else if (str[i] === b[1]) {
      level--;
      if (level < 0) {
        return i;
      }
    }
  }
  if (level > 0) {
    return -2;
  }

  return -1;
}

interface LastPossibleEmStrongCloserIndex {
  /** Last `*` run that can close emphasis or strong. `-1` if none. */
  '*': number;
  /** Last `_` run that can close emphasis or strong. `-1` if none. */
  _: number;
}

/**
 * Closer hints for one inline `maskedSrc`. Held only while that pass runs.
 */
interface EmStrongDelCloserHintFrame {
  maskedSrc: string;
  lastPossibleEmStrongCloserIndex: LastPossibleEmStrongCloserIndex;
  /** Last `~` run that can close strikethrough. `-1` if none. */
  lastPossibleDelCloserIndex: number;
}

/**
 * Hint stacks for inline passes currently running. Keyed by the tokenizer
 * instance so parses do not share frames. Nested `inlineTokens` calls push
 * a frame. The entry is removed when the outermost pass ends, so
 * `maskedSrc` is not retained once parsing returns (#4099).
 */
const emStrongDelCloserHintStacks = new WeakMap<object, EmStrongDelCloserHintFrame[]>();

/**
 * Last indexes of `*` / `_` runs that can close emphasis or strong, and of
 * a `~` run that can close strikethrough.
 *
 * A run can close only when it is not preceded by ASCII whitespace or the
 * start of the string. The right-delim regexes accept a closer only in
 * groups 1, 2, 5, and 6, and each of those requires that predecessor. When
 * the opener's window has no such run, the regex scan cannot succeed.
 * Finding one only means "keep looking": CommonMark rules 9–10 and mid-run
 * openers are still applied in the loop (#4099).
 */
function scanLastPossibleEmStrongDelClosers(src: string): EmStrongDelCloserHintFrame {
  const lastPossibleEmStrongCloserIndex: LastPossibleEmStrongCloserIndex = { '*': -1, _: -1 };
  let lastPossibleDelCloserIndex = -1;
  const len = src.length;
  for (let i = 0; i < len; i++) {
    const ch = src[i];
    if (ch !== '*' && ch !== '_' && ch !== '~') {
      continue;
    }
    // A leading run has no predecessor, same as one after a line break.
    const prev = i === 0 ? '\n' : src[i - 1];
    let j = i + 1;
    while (j < len && src[j] === ch) {
      j++;
    }
    if (prev !== ' ' && prev !== '\t' && prev !== '\n' && prev !== '\r' && prev !== '\f') {
      if (ch === '~') {
        lastPossibleDelCloserIndex = i;
      } else {
        lastPossibleEmStrongCloserIndex[ch] = i;
      }
    }
    i = j - 1;
  }
  return {
    maskedSrc: src,
    lastPossibleEmStrongCloserIndex,
    lastPossibleDelCloserIndex,
  };
}

/**
 * Scan `maskedSrc` once for the last `*` / `_` run that can close emphasis
 * or strong and the last `~` run that can close strikethrough.
 * `endEmStrongDelCloserScan` drops this frame when the inline pass ends.
 */
export function beginEmStrongDelCloserScan(tokenizer: object, maskedSrc: string): void {
  const frame = scanLastPossibleEmStrongDelClosers(maskedSrc);
  const stack = emStrongDelCloserHintStacks.get(tokenizer);
  if (stack) {
    stack.push(frame);
  } else {
    emStrongDelCloserHintStacks.set(tokenizer, [frame]);
  }
}

/**
 * Drop the closer-hint frame for the inline pass that just finished.
 * Removing the last frame drops the tokenizer's `maskedSrc` reference.
 */
export function endEmStrongDelCloserScan(tokenizer: object): void {
  const stack = emStrongDelCloserHintStacks.get(tokenizer);
  if (!stack) {
    return;
  }
  stack.pop();
  if (stack.length === 0) {
    emStrongDelCloserHintStacks.delete(tokenizer);
  }
}

/**
 * Index in `maskedSrc` of the last `*` or `_` run that can close emphasis
 * or strong. Uses the active inline-pass scan when `maskedSrc` is that
 * pass's source; otherwise scans this string and discards the result.
 */
export function cachedLastPossibleEmStrongCloserIndex(tokenizer: object, maskedSrc: string, delim: '*' | '_'): number {
  const frame = emStrongDelCloserHintStacks.get(tokenizer)?.at(-1);
  if (frame && frame.maskedSrc === maskedSrc) {
    return frame.lastPossibleEmStrongCloserIndex[delim];
  }
  return scanLastPossibleEmStrongDelClosers(maskedSrc).lastPossibleEmStrongCloserIndex[delim];
}

/**
 * Index in `maskedSrc` of the last `~` run that can close strikethrough.
 * Uses the active inline-pass scan when `maskedSrc` is that pass's
 * source; otherwise scans this string and discards the result.
 */
export function cachedLastPossibleDelCloserIndex(tokenizer: object, maskedSrc: string): number {
  const frame = emStrongDelCloserHintStacks.get(tokenizer)?.at(-1);
  if (frame && frame.maskedSrc === maskedSrc) {
    return frame.lastPossibleDelCloserIndex;
  }
  return scanLastPossibleEmStrongDelClosers(maskedSrc).lastPossibleDelCloserIndex;
}

export interface BareEmailRange {
  /** Start index of the maximal `[A-Za-z0-9._+-]` run before `@`. */
  start: number;
  /** Index of `@`. */
  at: number;
  /** Exclusive end index of the matched domain after `@`. */
  end: number;
}

/**
 * Per-pass bare GFM email autolink index for one inline `src`. Held only while
 * that pass runs so `src` is not retained once lexing returns.
 */
export interface InlineEmailScanFrame {
  /** Whether `src` contains any `@` character. */
  hasAt: boolean;
  /** Non-overlapping valid bare email autolinks in `src`, sorted by `start`. */
  emails: readonly BareEmailRange[];
  /** Monotonic cursor into `emails` as the lexer advances through `src`. */
  cursor: number;
  /** Exact substring currently passed to `url` or `inlineText`. */
  currentSrc: string;
  /** Start offset of `currentSrc` within the pass's full `src`. */
  pos: number;
}

const EMPTY_EMAIL_RANGES: readonly BareEmailRange[] = [];

const inlineEmailScanStacks = new WeakMap<object, InlineEmailScanFrame[]>();

function isEmailLocalChar(code: number): boolean {
  return (code >= 97 && code <= 122) // a-z
    || (code >= 65 && code <= 90) // A-Z
    || (code >= 48 && code <= 57) // 0-9
    || code === 46 // .
    || code === 95 // _
    || code === 43 // +
    || code === 45; // -
}

/**
 * Scan `src` once in O(n) time for every `@` that has both a non-empty
 * `[A-Za-z0-9._+-]` local-part run before it and a valid GFM email domain
 * directly after it. Because `@` is not in the local-part class, backward
 * local-part scans are pairwise disjoint and intervals `[start, at)` are
 * disjoint and strictly increasing.
 */
function scanBareEmails(src: string): readonly BareEmailRange[] {
  let emails: BareEmailRange[] | undefined;
  let searchFrom = 0;
  while (true) {
    const at = src.indexOf('@', searchFrom);
    if (at === -1) {
      break;
    }
    searchFrom = at + 1;

    let start = at;
    while (start > 0 && isEmailLocalChar(src.charCodeAt(start - 1))) {
      start--;
    }
    if (start === at) {
      continue;
    }

    other.emailDomainSticky.lastIndex = at + 1;
    const domain = other.emailDomainSticky.exec(src);
    if (!domain) {
      continue;
    }

    emails ??= [];
    emails.push({
      start,
      at,
      end: at + 1 + domain[0].length,
    });
  }
  return emails ?? EMPTY_EMAIL_RANGES;
}

/**
 * Push a per-pass bare email scan frame for `src`. Call `endInlineEmailScan`
 * in a `finally` block when the pass ends so no strings are retained (#4272).
 */
export function beginInlineEmailScan(tokenizer: object, src: string): InlineEmailScanFrame {
  const hasAt = src.includes('@');
  const frame: InlineEmailScanFrame = {
    hasAt,
    emails: hasAt ? scanBareEmails(src) : EMPTY_EMAIL_RANGES,
    cursor: 0,
    currentSrc: '',
    pos: 0,
  };
  const stack = inlineEmailScanStacks.get(tokenizer);
  if (stack) {
    stack.push(frame);
  } else {
    inlineEmailScanStacks.set(tokenizer, [frame]);
  }
  return frame;
}

/**
 * Pop the active inline email scan frame for `tokenizer`.
 */
export function endInlineEmailScan(tokenizer: object): void {
  const stack = inlineEmailScanStacks.get(tokenizer);
  if (!stack) {
    return;
  }
  stack.pop();
  if (stack.length === 0) {
    inlineEmailScanStacks.delete(tokenizer);
  }
}

/**
 * Return the active inline email scan frame for `tokenizer`, if any.
 */
export function getActiveInlineEmailScan(tokenizer: object): InlineEmailScanFrame | undefined {
  return inlineEmailScanStacks.get(tokenizer)?.at(-1);
}

/**
 * Return the bare email range covering `pos` (`start <= pos < at`), if any.
 */
export function findBareEmailAt(frame: InlineEmailScanFrame, pos: number): BareEmailRange | undefined {
  const emails = frame.emails;
  let cursor = frame.cursor;
  while (cursor < emails.length && emails[cursor].at <= pos) {
    cursor++;
  }
  frame.cursor = cursor;
  if (cursor < emails.length && emails[cursor].start <= pos) {
    return emails[cursor];
  }
}

/**
 * Return the start offset of the first bare email autolink that begins
 * strictly after `pos` and whose `@` lies before `cutEnd`, or `-1`.
 */
export function findNextBareEmailStart(
  frame: InlineEmailScanFrame,
  pos: number,
  cutEnd: number,
): number {
  const emails = frame.emails;
  let cursor = frame.cursor;
  while (cursor < emails.length && emails[cursor].at <= pos) {
    cursor++;
  }
  frame.cursor = cursor;
  let idx = cursor;
  if (idx < emails.length && emails[idx].start <= pos) {
    idx++;
  }
  if (idx < emails.length) {
    const next = emails[idx];
    if (next.at < cutEnd) {
      return next.start;
    }
  }
  return -1;
}

export function expandTabs(line: string, indent = 0) {
  let col = indent;
  let expanded = '';
  for (const char of line) {
    if (char === '\t') {
      const added = 4 - (col % 4);
      expanded += ' '.repeat(added);
      col += added;
    } else {
      expanded += char;
      col++;
    }
  }

  return expanded;
}
