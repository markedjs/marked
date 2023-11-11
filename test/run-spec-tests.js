import { Marked } from '../lib/marked.esm.js';
import { getTests, runTests, outputCompletionTable } from '@markedjs/testutils';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

function parse(markdown, options) {
  const marked = new Marked(options);
  return marked.parse(markdown);
}

const __dirname = dirname(fileURLToPath(import.meta.url));

const [commonMarkTests, gfmTests, newTests, originalTests, redosTests] =
  await getTests([
    resolve(__dirname, './specs/commonmark'),
    resolve(__dirname, './specs/gfm'),
    resolve(__dirname, './specs/new'),
    resolve(__dirname, './specs/original'),
    resolve(__dirname, './specs/redos')
  ]);

outputCompletionTable('CommonMark', commonMarkTests);
runTests({
  tests: commonMarkTests,
  parse,
  defaultMarkedOptions: { gfm: false, pedantic: false }
});

outputCompletionTable('GFM', gfmTests);
runTests({
  tests: gfmTests,
  parse,
  defaultMarkedOptions: { gfm: true, pedantic: false }
});

runTests({
  tests: newTests,
  parse
});

runTests({
  tests: originalTests,
  parse,
  defaultMarkedOptions: { gfm: false, pedantic: true }
});

runTests({
  tests: redosTests,
  parse
});
