const { mkdir, rmdir, readdir, stat, readFile, writeFile, copyFile } = require('fs').promises;
const { join, dirname, parse, format } = require('path');
const marked = require('./');
const { highlight, highlightAuto } = require('highlight.js');
const titleize = require('titleize');
const cwd = process.cwd();
const inputDir = join(cwd, 'docs');
const outputDir = join(cwd, 'public');
const templateFile = join(inputDir, '_document.html');
const isUppercase = str => /[A-Z_]+/.test(str);
const getTitle = str => str === 'INDEX' ? '' : titleize(str.replace(/_/g, ' ')) + ' - ';

async function init() {
  console.log('Cleaning up output directory ' + outputDir);
  await rmdir(outputDir, { recursive: true });
  await mkdir(outputDir);
  await copyFile(join(cwd, 'LICENSE.md'), join(inputDir, 'LICENSE.md'));
  const tmpl = await readFile(templateFile, 'utf8');
  console.log('Building markdown...');
  await build(inputDir, tmpl);
  console.log('Build complete!');
}

async function build(currentDir, tmpl) {
  const files = await readdir(currentDir);
  for (const file of files) {
    const filename = join(currentDir, file);
    const stats = await stat(filename);
    const { mode } = stats;
    if (stats.isDirectory()) {
      // console.log('Found directory ' + filename);
      await build(filename, tmpl);
    } else {
      // console.log('Reading file ' + filename);
      let buffer = await readFile(filename);
      const parsed = parse(filename);
      if (parsed.ext === '.md' && isUppercase(parsed.name)) {
        const html = marked(buffer.toString('utf8'), {
          highlight: (code, lang) => {
            if (!lang) {
              return highlightAuto(code).value;
            }
            return highlight(lang, code).value;
          }
        });
        buffer = Buffer.from(tmpl
          .replace('<!--{{title}}-->', getTitle(parsed.name))
          .replace('<!--{{content}}-->', html),
        'utf8'
        );
        parsed.ext = '.html';
        parsed.name = parsed.name.toLowerCase();
        delete parsed.base;
      }
      parsed.dir = parsed.dir.replace(inputDir, outputDir);
      const outfile = format(parsed);
      // console.log('Ensure directory ' + dirname(outfile));
      await mkdir(dirname(outfile), { recursive: true });
      console.log('Writing file ' + outfile);
      await writeFile(outfile, buffer, { mode });
    }
  }
}

init().catch(console.error);
