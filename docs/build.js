/* global marked */
import '../marked.min.js';
import { promises } from 'fs';
import { join, dirname, parse, format } from 'path';
import { fileURLToPath } from 'url';
import { markedHighlight } from 'marked-highlight';
import { HighlightJS } from 'highlight.js';
import titleize from 'titleize';
import { getTests } from '@markedjs/testutils';

const { mkdir, rm, readdir, stat, readFile, writeFile, copyFile } = promises;
const { highlight, highlightAuto } = HighlightJS;
const cwd = process.cwd();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const inputDir = join(cwd, 'docs');
const outputDir = join(cwd, 'public');
const templateFile = join(inputDir, '_document.html');
const isUppercase = str => /[A-Z_]+/.test(str);
const getTitle = str => str === 'INDEX' ? '' : titleize(str.replace(/_/g, ' ')) + ' - ';
function convertTestsToTable(name, tests) {
  let total = 0;
  let passing = 0;
  let table = '\n| Section | Passing | Percent |\n';
  table += '|:--------|:--------|--------:|\n';
  for (const [key, value] of Object.entries(tests)) {
    total += value.total;
    passing += value.pass;
    table += ` | ${key}`;
    table += ` | ${(value.pass)} of ${(value.total)}`;
    table += ` | ${((value.pass) / value.total * 100).toFixed()}%`;
    table += ' |\n';
  }
  return `\n<details name="markdown-spec">
  <summary>${name} (${(passing / total * 100).toFixed()}%)</summary>
  ${table}
</details>\n`;
}

const markedInstance = new marked.Marked(markedHighlight((code, language) => {
  if (!language) {
    return highlightAuto(code).value;
  }
  return highlight(code, { language }).value;
}));

async function init() {
  console.log('Cleaning up output directory ' + outputDir);
  await rm(outputDir, { force: true, recursive: true });
  await mkdir(outputDir);
  console.log(`Copying file ${join(inputDir, 'LICENSE.md')}`);
  await copyFile(join(cwd, 'LICENSE.md'), join(inputDir, 'LICENSE.md'));
  console.log(`Copying file ${join(outputDir, 'marked.min.js')}`);
  await copyFile(join(cwd, 'marked.min.js'), join(outputDir, 'marked.min.js'));
  const tmpl = await readFile(templateFile, 'utf8');
  console.log('Building markdown...');
  const [original, commonmark, gfm] = await getTests([
    join(__dirname, '../test/specs/original'),
    join(__dirname, '../test/specs/commonmark'),
    join(__dirname, '../test/specs/gfm'),
  ]);
  const testResultsTable =
    convertTestsToTable('Markdown 1.0', original)
    + convertTestsToTable('CommonMark 0.31', commonmark)
    + convertTestsToTable('GitHub Flavored Markdown 0.29', gfm);
  await build(inputDir, tmpl, testResultsTable);
  console.log('Build complete!');
}

const ignoredFiles = [
  join(cwd, 'docs', 'build.js'),
  join(cwd, 'docs', '.eslintrc.json'),
  join(cwd, 'docs', '_document.html'),
];

async function build(currentDir, tmpl, testResultsTable) {
  const files = await readdir(currentDir);
  for (const file of files) {
    const filename = join(currentDir, file);
    if (ignoredFiles.includes(filename)) {
      continue;
    }
    const stats = await stat(filename);
    const { mode } = stats;
    if (stats.isDirectory()) {
      await build(filename, tmpl);
    } else {
      let html = await readFile(filename, 'utf8');
      const parsed = parse(filename);
      if (parsed.ext === '.md' && isUppercase(parsed.name)) {
        const mdHtml = markedInstance.parse(
          html.replace('<!--{{test-results-table}}-->', testResultsTable),
        );
        html = tmpl
          .replace('<!--{{title}}-->', getTitle(parsed.name))
          .replace('<!--{{content}}-->', mdHtml);
        parsed.ext = '.html';
        parsed.name = parsed.name.toLowerCase();
        delete parsed.base;
      }
      parsed.dir = parsed.dir.replace(inputDir, outputDir);
      const outfile = format(parsed);
      await mkdir(dirname(outfile), { recursive: true });
      console.log('Writing file ' + outfile);
      await writeFile(outfile, html, { mode });
    }
  }
}

init().catch(console.error);
