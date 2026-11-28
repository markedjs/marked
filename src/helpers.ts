import { inline, other } from './rules.ts';

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

interface CloserQueryTable {
  bal: Int32Array;
  mid: Int32Array | null;
  nextBreak: Int32Array | null;
  tree: Int32Array;
  cap: number;
}

interface EmStrongCloserIndex {
  starts: number[];
  lens: number[];
  kinds: number[]; // 0 = RIGHT, 1 = LEFT, 2 = BOTH
  tables: (CloserQueryTable | undefined)[];
}

interface DelCloserIndex {
  starts: number[];
  lens: number[];
  kinds: number[]; // 0 = RIGHT/BOTH, 1 = LEFT
  tables: (CloserQueryTable | undefined)[];
}

/**
 * Closer hints for one inline `maskedSrc`. Held only while that pass runs.
 */
export interface EmStrongDelCloserHintFrame {
  maskedSrc: string;
  lastPossibleEmStrongCloserIndex: LastPossibleEmStrongCloserIndex;
  /** Last `~` run that can close strikethrough. `-1` if none. */
  lastPossibleDelCloserIndex: number;
  /** Active sub-slice of `maskedSrc` for iterative nested emphasis frames. */
  subMaskedSrc: string;
  subStart: number;
  subEnd: number;
  /** Set by `Lexer.#tokenizeInlines` when default `emStrong`/`del` may defer child tokenization. */
  deferInline: boolean;
  deferred: boolean;
  emStrongIndex?: { '*': EmStrongCloserIndex | null; _: EmStrongCloserIndex | null };
  delIndex?: DelCloserIndex | null;
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
    subMaskedSrc: src,
    subStart: 0,
    subEnd: len,
    deferInline: false,
    deferred: false,
  };
}

/**
 * Scan `maskedSrc` once for the last `*` / `_` run that can close emphasis
 * or strong and the last `~` run that can close strikethrough.
 * `endEmStrongDelCloserScan` drops this frame when the inline pass ends.
 */
export function beginEmStrongDelCloserScan(tokenizer: object, maskedSrc: string): EmStrongDelCloserHintFrame {
  const frame = scanLastPossibleEmStrongDelClosers(maskedSrc);
  const stack = emStrongDelCloserHintStacks.get(tokenizer);
  if (stack) {
    stack.push(frame);
  } else {
    emStrongDelCloserHintStacks.set(tokenizer, [frame]);
  }
  return frame;
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
 * Return the active closer-hint frame when `maskedSrc` matches either the
 * frame's root `maskedSrc` or its current iterative sub-frame slice.
 */
export function getActiveEmStrongDelCloserFrame(tokenizer: object, maskedSrc: string): EmStrongDelCloserHintFrame | undefined {
  const frame = emStrongDelCloserHintStacks.get(tokenizer)?.at(-1);
  if (frame && (frame.maskedSrc === maskedSrc || frame.subMaskedSrc === maskedSrc)) {
    return frame;
  }
  return undefined;
}

/**
 * Index in `maskedSrc` of the last `*` or `_` run that can close emphasis
 * or strong. Uses the active inline-pass scan when `maskedSrc` is that
 * pass's source (or an iterative sub-frame); otherwise scans this string
 * and discards the result.
 */
export function cachedLastPossibleEmStrongCloserIndex(tokenizer: object, maskedSrc: string, delim: '*' | '_'): number {
  const frame = emStrongDelCloserHintStacks.get(tokenizer)?.at(-1);
  if (frame) {
    if (frame.maskedSrc === maskedSrc) {
      return frame.lastPossibleEmStrongCloserIndex[delim];
    }
    if (frame.subMaskedSrc === maskedSrc) {
      const rootLast = frame.lastPossibleEmStrongCloserIndex[delim];
      return rootLast < frame.subStart ? -1 : rootLast - frame.subStart;
    }
  }
  return scanLastPossibleEmStrongDelClosers(maskedSrc).lastPossibleEmStrongCloserIndex[delim];
}

/**
 * Index in `maskedSrc` of the last `~` run that can close strikethrough.
 * Uses the active inline-pass scan when `maskedSrc` is that pass's
 * source (or an iterative sub-frame); otherwise scans this string and
 * discards the result.
 */
export function cachedLastPossibleDelCloserIndex(tokenizer: object, maskedSrc: string): number {
  const frame = emStrongDelCloserHintStacks.get(tokenizer)?.at(-1);
  if (frame) {
    if (frame.maskedSrc === maskedSrc) {
      return frame.lastPossibleDelCloserIndex;
    }
    if (frame.subMaskedSrc === maskedSrc) {
      const rootLast = frame.lastPossibleDelCloserIndex;
      return rootLast < frame.subStart ? -1 : rootLast - frame.subStart;
    }
  }
  return scanLastPossibleEmStrongDelClosers(maskedSrc).lastPossibleDelCloserIndex;
}

export function isBuiltinEmStrongRDelim(reg: RegExp): boolean {
  return reg === inline.normal.emStrongRDelimAst
    || reg === inline.gfm.emStrongRDelimAst
    || reg === inline.pedantic.emStrongRDelimAst
    || reg === inline.normal.emStrongRDelimUnd
    || reg === inline.pedantic.emStrongRDelimUnd;
}

export function isBuiltinDelRDelim(reg: RegExp): boolean {
  return reg === inline.gfm.delRDelim;
}

function buildMinSegTree(bal: Int32Array, k: number): { tree: Int32Array; cap: number } {
  let cap = 1;
  while (cap < k) {
    cap <<= 1;
  }
  const tree = new Int32Array(cap << 1);
  tree.fill(0x7fffffff, cap + k);
  for (let i = 0; i < k; i++) {
    tree[cap + i] = bal[i + 1];
  }
  for (let p = cap - 1; p > 0; p--) {
    const left = tree[p << 1];
    const right = tree[(p << 1) | 1];
    tree[p] = left < right ? left : right;
  }
  return { tree, cap };
}

function queryFirstLe(tree: Int32Array, cap: number, lIdx: number, rIdx: number, target: number): number {
  let l = lIdx + cap;
  let r = rIdx + cap;
  let bestRight = 0;
  while (l < r) {
    if (l & 1) {
      if (tree[l] <= target) {
        let p = l;
        while (p < cap) {
          p = tree[p << 1] <= target ? p << 1 : (p << 1) | 1;
        }
        return p - cap;
      }
      l++;
    }
    if (r & 1) {
      --r;
      if (tree[r] <= target) {
        bestRight = r;
      }
    }
    l >>= 1;
    r >>= 1;
  }
  if (bestRight !== 0) {
    let p = bestRight;
    while (p < cap) {
      p = tree[p << 1] <= target ? p << 1 : (p << 1) | 1;
    }
    return p - cap;
  }
  return -1;
}

function lowerBound(arr: number[], target: number): number {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid] < target) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}

/**
 * Match the `^[^_*]*?__[^_*]*?\*[^_*]*?(?=__)` (or `**` / `_`) orphan-inside-strong
 * prefix of the right-delimiter regex at `[start, end)` without regex slicing.
 */
function findOrphanInsideStrongEnd(maskedSrc: string, start: number, end: number, delimChar: '*' | '_'): number {
  const other = delimChar === '*' ? '_' : '*';
  let i = start;
  while (i < end) {
    const ch = maskedSrc[i];
    if (ch === delimChar) {
      return -1;
    }
    if (ch === other) {
      if (i + 1 >= end || maskedSrc[i + 1] !== other) {
        return -1;
      }
      let j = i + 2;
      while (j < end) {
        const c2 = maskedSrc[j];
        if (c2 === other) {
          return -1;
        }
        if (c2 === delimChar) {
          let k = j + 1;
          while (k < end) {
            const c3 = maskedSrc[k];
            if (c3 === delimChar) {
              return -1;
            }
            if (c3 === other) {
              return k + 1 < end && maskedSrc[k + 1] === other ? k : -1;
            }
            k++;
          }
          return -1;
        }
        j++;
      }
      return -1;
    }
    i++;
  }
  return -1;
}

function scanDelimiterRuns(rootMaskedSrc: string, endReg: RegExp, delimChar: string, distinguishBoth: boolean) {
  const starts: number[] = [];
  const lens: number[] = [];
  const kinds: number[] = [];
  // Prepending `delimChar` blocks the `^` orphan-inside-strong prefix at index 0
  // and cannot match rules (1)-(6) as a predecessor.
  const scanSrc = delimChar + rootMaskedSrc;
  endReg.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = endReg.exec(scanSrc)) !== null) {
    const rDelim = match[1] || match[2] || match[3] || match[4] || match[5] || match[6];
    if (!rDelim) {
      continue;
    }
    const len = rDelim.length;
    const start = endReg.lastIndex - 1 - len;
    const kind = (match[3] || match[4]) ? 1 : (distinguishBoth && (match[5] || match[6])) ? 2 : 0;
    starts.push(start);
    lens.push(len);
    kinds.push(kind);
  }
  return { starts, lens, kinds };
}

function buildEmStrongQueryTable(index: EmStrongCloserIndex, mod: number, openerCanClose: boolean, midRun: boolean): CloserQueryTable {
  const { lens, kinds } = index;
  const k = lens.length;
  const bal = new Int32Array(k + 1);
  const mid = new Int32Array(k + 1);
  const nextBreak = midRun ? new Int32Array(k + 1) : null;

  for (let i = 0; i < k; i++) {
    const kind = kinds[i];
    const len = lens[i];
    let delta = 0;
    let midDelta = 0;
    if (kind === 1) {
      delta = len;
    } else if (kind === 0) {
      if (openerCanClose && mod !== 0 && (mod + len) % 3 === 0) {
        midDelta = len;
      } else {
        delta = -len;
      }
    } else if (mod !== 0 && (mod + len) % 3 === 0) {
      midDelta = len;
    } else {
      delta = -len;
    }
    bal[i + 1] = bal[i] + delta;
    mid[i + 1] = mid[i] + midDelta;
  }

  if (nextBreak) {
    let brk = k;
    nextBreak[k] = k;
    for (let i = k - 1; i >= 0; i--) {
      if (kinds[i] === 2 && mod !== 0 && (mod + lens[i]) % 3 === 0) {
        brk = i;
      }
      nextBreak[i] = brk;
    }
  }

  return {
    bal,
    mid,
    nextBreak,
    ...buildMinSegTree(bal, k),
  };
}

function isTailRunCloser(localMaskedSrc: string, tailLocalStart: number, minCheckFrom: number, endReg: RegExp): boolean {
  endReg.lastIndex = Math.max(minCheckFrom, tailLocalStart - 2);
  let match: RegExpExecArray | null;
  while ((match = endReg.exec(localMaskedSrc)) !== null) {
    const rDelim = match[1] || match[2] || match[3] || match[4] || match[5] || match[6];
    if (!rDelim) {
      continue;
    }
    if (endReg.lastIndex - rDelim.length === tailLocalStart) {
      return !(match[3] || match[4]);
    }
  }
  return false;
}

export function buildEmStrongCloserIndex(frame: EmStrongDelCloserHintFrame, endReg: RegExp, delimChar: '*' | '_'): EmStrongCloserIndex {
  const runs = scanDelimiterRuns(frame.maskedSrc, endReg, delimChar, true);
  const index: EmStrongCloserIndex = {
    ...runs,
    tables: new Array(12),
  };
  if (!frame.emStrongIndex) {
    frame.emStrongIndex = { '*': null, _: null };
  }
  frame.emStrongIndex[delimChar] = index;
  return index;
}

export function findEmStrongCloserIndexed(
  frame: EmStrongDelCloserHintFrame,
  index: EmStrongCloserIndex,
  localMaskedSrc: string,
  localSrcStart: number,
  lLength: number,
  runLength: number,
  openerCanClose: boolean,
  midRun: boolean,
  delimChar: '*' | '_',
  endReg: RegExp,
): { rawLength: number; rLength: number } | undefined {
  const isSubFrame = frame.subMaskedSrc === localMaskedSrc && frame.maskedSrc !== localMaskedSrc;
  const frameStart = isSubFrame ? frame.subStart : 0;
  const frameEnd = isSubFrame ? frame.subEnd : frame.maskedSrc.length;
  const rootSrcStart = frameStart + localSrcStart;
  let effectiveRootSliceStart = rootSrcStart + lLength;

  const orphanEnd = findOrphanInsideStrongEnd(frame.maskedSrc, effectiveRootSliceStart, frameEnd, delimChar);
  if (orphanEnd !== -1) {
    effectiveRootSliceStart = orphanEnd;
  }

  const { starts, lens, tables } = index;
  const k = starts.length;
  const firstRunIdx = lowerBound(starts, effectiveRootSliceStart);
  if (firstRunIdx >= k) {
    return undefined;
  }

  let limitIdx = k;
  let tailLen = 0;
  if (frameEnd < frame.maskedSrc.length) {
    limitIdx = lowerBound(starts, frameEnd);
    if (limitIdx > 0 && starts[limitIdx - 1] + lens[limitIdx - 1] >= frameEnd) {
      limitIdx--;
    }
    if (limitIdx >= firstRunIdx && limitIdx < k && starts[limitIdx] < frameEnd) {
      const candidateTailLen = frameEnd - starts[limitIdx];
      if (isTailRunCloser(localMaskedSrc, starts[limitIdx] - frameStart, localSrcStart + lLength, endReg)) {
        tailLen = candidateTailLen;
      }
    }
  }

  const mod = runLength % 3;
  const tableKey = (mod << 2) | (openerCanClose ? 2 : 0) | (midRun ? 1 : 0);
  let table = tables[tableKey];
  if (!table) {
    table = buildEmStrongQueryTable(index, mod, openerCanClose, midRun);
    tables[tableKey] = table;
  }

  if (midRun && table.nextBreak) {
    const brk = table.nextBreak[firstRunIdx];
    if (brk < limitIdx) {
      limitIdx = brk;
      tailLen = 0;
    }
  }

  if (firstRunIdx < limitIdx) {
    const target = table.bal[firstRunIdx] - lLength;
    const matchIdx = queryFirstLe(table.tree, table.cap, firstRunIdx, limitIdx, target);
    if (matchIdx !== -1) {
      const delimTotal = lLength + (table.bal[matchIdx + 1] - table.bal[firstRunIdx]);
      const midDelimTotal = table.mid![matchIdx + 1] - table.mid![firstRunIdx];
      const rLength = Math.min(lens[matchIdx], lens[matchIdx] + delimTotal + midDelimTotal);
      return {
        rawLength: (starts[matchIdx] - rootSrcStart) + rLength,
        rLength,
      };
    }
  }

  if (tailLen > 0 && !(openerCanClose && mod !== 0 && (mod + tailLen) % 3 === 0)) {
    const delimTotal = lLength + (table.bal[limitIdx] - table.bal[firstRunIdx]) - tailLen;
    if (delimTotal <= 0) {
      const midDelimTotal = table.mid![limitIdx] - table.mid![firstRunIdx];
      const rLength = Math.min(tailLen, tailLen + delimTotal + midDelimTotal);
      return {
        rawLength: (starts[limitIdx] - rootSrcStart) + rLength,
        rLength,
      };
    }
  }

  return undefined;
}

function buildDelQueryTable(index: DelCloserIndex, targetLen: number): CloserQueryTable {
  const { lens, kinds } = index;
  const k = lens.length;
  const bal = new Int32Array(k + 1);
  for (let i = 0; i < k; i++) {
    const len = lens[i];
    const delta = len === targetLen ? (kinds[i] === 1 ? len : -len) : 0;
    bal[i + 1] = bal[i] + delta;
  }
  return {
    bal,
    mid: null,
    nextBreak: null,
    ...buildMinSegTree(bal, k),
  };
}

export function buildDelCloserIndex(frame: EmStrongDelCloserHintFrame, endReg: RegExp): DelCloserIndex {
  const runs = scanDelimiterRuns(frame.maskedSrc, endReg, '~', false);
  const index: DelCloserIndex = {
    ...runs,
    tables: new Array(2),
  };
  frame.delIndex = index;
  return index;
}

export function findDelCloserIndexed(
  frame: EmStrongDelCloserHintFrame,
  index: DelCloserIndex,
  localMaskedSrc: string,
  localSrcStart: number,
  lLength: number,
  endReg: RegExp,
): number {
  const isSubFrame = frame.subMaskedSrc === localMaskedSrc && frame.maskedSrc !== localMaskedSrc;
  const frameStart = isSubFrame ? frame.subStart : 0;
  const frameEnd = isSubFrame ? frame.subEnd : frame.maskedSrc.length;
  const rootSrcStart = frameStart + localSrcStart;
  const rootSliceStart = rootSrcStart + lLength;

  const { starts, lens, tables } = index;
  const k = starts.length;
  const firstRunIdx = lowerBound(starts, rootSliceStart);
  if (firstRunIdx >= k) {
    return -1;
  }

  let limitIdx = k;
  let tailLen = 0;
  if (frameEnd < frame.maskedSrc.length) {
    limitIdx = lowerBound(starts, frameEnd);
    if (limitIdx > 0 && starts[limitIdx - 1] + lens[limitIdx - 1] >= frameEnd) {
      limitIdx--;
    }
    if (limitIdx >= firstRunIdx && limitIdx < k && starts[limitIdx] < frameEnd) {
      const candidateTailLen = frameEnd - starts[limitIdx];
      if (candidateTailLen === lLength && isTailRunCloser(localMaskedSrc, starts[limitIdx] - frameStart, localSrcStart + lLength, endReg)) {
        tailLen = candidateTailLen;
      }
    }
  }

  const slot = lLength - 1;
  let table = tables[slot];
  if (!table) {
    table = buildDelQueryTable(index, lLength);
    tables[slot] = table;
  }

  if (firstRunIdx < limitIdx) {
    const target = table.bal[firstRunIdx] - lLength;
    const matchIdx = queryFirstLe(table.tree, table.cap, firstRunIdx, limitIdx, target);
    if (matchIdx !== -1) {
      return (starts[matchIdx] - rootSrcStart) + lLength;
    }
  }

  if (tailLen > 0) {
    const delimTotal = lLength + (table.bal[limitIdx] - table.bal[firstRunIdx]) - tailLen;
    if (delimTotal <= 0) {
      return (starts[limitIdx] - rootSrcStart) + lLength;
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

/**
 * Expands the tabs in block quote markers and the indentation after them to spaces, with tab
 * stops measured from the start of the line. Inside fenced code the indentation is code content,
 * so a tab there stays literal. Lines from the first list item on are returned as is, because
 * the item's columns and the fences inside it are not tracked here.
 */
export function expandBlockquoteTabs(lines: string[]) {
  let fence: { marker: string, depth: number } | undefined;
  let inListItem = false;
  return lines.map((line) => {
    if (inListItem) {
      return line;
    }
    const { depth, expanded, keptIndent, content } = splitBlockquoteLine(line, fence?.depth ?? Infinity);
    if (fence?.depth !== depth) {
      fence = undefined;
    }
    if (fence) {
      const close = other.blockquoteFenceClose.exec(content)?.[1];
      if (!close || close[0] !== fence.marker[0] || close.length < fence.marker.length) {
        return keptIndent;
      }
      fence = undefined;
      return expanded;
    }
    inListItem = other.blockquoteListItemStart.test(content);
    if (inListItem) {
      return line;
    }
    const open = other.blockquoteFenceOpen.exec(content)?.[1];
    if (open) {
      fence = { marker: open, depth };
    }
    return expanded;
  }).join('\n');
}

/**
 * Reads the `>` markers at the start of a line. `expanded` has the tabs in them and in the
 * content's first four columns of indentation expanded, `keptIndent` only the tab that the
 * optional space after the last marker cuts into, and `content` is what follows the markers.
 */
function splitBlockquoteLine(line: string, maxDepth: number) {
  let i = 0;
  let col = 0;
  let depth = 0;
  let contentCol = 0;
  let prefix = '';

  while (depth < maxDepth) {
    let j = i;
    let markerCol = col;
    while (line[j] === ' ' || line[j] === '\t') {
      markerCol += tabWidth(line[j], markerCol);
      j++;
    }
    if (line[j] !== '>' || markerCol - contentCol > 3) {
      break;
    }
    prefix += ' '.repeat(markerCol - col) + '>';
    depth++;
    i = j + 1;
    col = markerCol + 1;
    contentCol = line[i] === ' ' || line[i] === '\t' ? col + 1 : col;
  }

  if (depth === 0) {
    return { depth, expanded: line, keptIndent: line, content: line };
  }

  let indent = '';
  let keptIndent = '';
  while ((line[i] === ' ' || line[i] === '\t') && col < contentCol + 4) {
    const added = tabWidth(line[i], col);
    indent += ' '.repeat(added);
    keptIndent += col < contentCol && added > 1 ? ' '.repeat(added) : line[i];
    col += added;
    i++;
  }

  const rest = line.slice(i);
  return {
    depth,
    expanded: prefix + indent + rest,
    keptIndent: prefix + keptIndent + rest,
    content: ' '.repeat(Math.max(0, col - contentCol)) + rest,
  };
}

function tabWidth(char: string, col: number) {
  return char === '\t' ? 4 - (col % 4) : 1;
}
