import { getTests, runTests, outputCompletionTable } from '@markedjs/testutils';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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
  defaultMarkedOptions: { gfm: false, pedantic: false }
});

outputCompletionTable('GFM', tests.GFM);
runTests({
  tests: tests.GFM,
  defaultMarkedOptions: { gfm: true, pedantic: false }
});

runTests({
  tests: tests.Original,
  defaultMarkedOptions: { gfm: false, pedantic: true }
});

runTests({
  tests: tests.New
});

runTests({
  tests: tests.RedDOS
});
