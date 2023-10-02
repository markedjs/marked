import { Marked } from '../lib/marked.esm.js';
import { getTests, runTests, outputCompletionTable } from '@markedjs/testutils';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

function parse(markdown, options) {
  const marked = new Marked(options);
  return marked.parse(markdown);
}

const __dirname = dirname(fileURLToPath(import.meta.url));

const tests = await getTests({
  CommonMark: resolve(__dirname, './specs/commonmark'),
  GFM: resolve(__dirname, './specs/gfm'),
  New: resolve(__dirname, './specs/new'),
  Original: resolve(__dirname, './specs/original'),
  ReDOS: resolve(__dirname, './specs/redos')
});

outputCompletionTable('CommonMark', tests.CommonMark);
runTests({
  tests: tests.CommonMark,
  parse,
  defaultMarkedOptions: { gfm: false, pedantic: false }
});

outputCompletionTable('GFM', tests.GFM);
runTests({
  tests: tests.GFM,
  parse,
  defaultMarkedOptions: { gfm: true, pedantic: false }
});

runTests({
  tests: tests.Original,
  parse,
  defaultMarkedOptions: { gfm: false, pedantic: true }
});

runTests({
  tests: tests.New,
  parse
});

runTests({
  tests: tests.RedDOS,
  parse
});
