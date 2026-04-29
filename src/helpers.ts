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

export function cleanUrl(href: string) {
  try {
    href = encodeURI(href).replace(other.percentDecode, '%');
  } catch {
    return null;
  }
  return href;
}

export function splitCells(tableRow: string, count?: number) {
  const cells: string[] = [];
  let currentCell = '';
  let inCode = false;
  let codeTickCount = 0;
  let escaped = false;

  for (let i = 0; i < tableRow.length; i++) {
    const char = tableRow[i];

    if (escaped) {
      // Handle escaped character
      currentCell += char;
      escaped = false;
    } else if (char === '\\') {
      // Start of escape sequence
      currentCell += char;
      escaped = true;
    } else if (char === '`' && !inCode) {
      // Start of code span - count backticks
      let tickCount = 1;
      while (i + tickCount < tableRow.length && tableRow[i + tickCount] === '`') {
        tickCount++;
      }
      codeTickCount = tickCount;
      inCode = true;
      currentCell += tableRow.slice(i, i + tickCount);
      i += tickCount - 1;
    } else if (char === '`' && inCode) {
      // Check for code span end - match backtick count
      let tickCount = 1;
      while (i + tickCount < tableRow.length && tableRow[i + tickCount] === '`') {
        tickCount++;
      }

      // Only end code span if backtick count matches and not escaped
      if (tickCount === codeTickCount) {
        // Check if this backtick sequence is not escaped
        let isEscaped = false;
        let j = i - 1;
        while (j >= 0 && tableRow[j] === '\\') {
          isEscaped = !isEscaped;
          j--;
        }

        if (!isEscaped) {
          inCode = false;
        }
      }

      currentCell += tableRow.slice(i, i + tickCount);
      i += tickCount - 1;
    } else if (char === '|' && !inCode) {
      // Cell delimiter (only if not in code span)
      cells.push(currentCell);
      currentCell = '';
    } else {
      // Regular character
      currentCell += char;
    }
  }

  // Add the last cell
  cells.push(currentCell);

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

  for (let i = 0; i < cells.length; i++) {
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

export function findClosingBracket(str: string, b: string) {
  if (str.indexOf(b[1]) === -1) {
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
