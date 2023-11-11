import fetch from 'node-fetch';
import { load } from 'cheerio';
import { Marked } from '../lib/marked.esm.js';
import { htmlIsEqual } from '@markedjs/testutils';
import { readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function removeFiles(dir) {
  readdirSync(dir).forEach(file => {
    unlinkSync(join(dir, file));
  });
}

async function updateCommonmark(dir, options) {
  try {
    const res = await fetch('https://raw.githubusercontent.com/commonmark/commonmark.js/master/package.json');
    const pkg = await res.json();
    const version = pkg.version.replace(/^(\d+\.\d+).*$/, '$1');
    const res2 = await fetch(`https://spec.commonmark.org/${version}/spec.json`);
    const json = await res2.json();
    const specs = await Promise.all(json.map(async(spec) => {
      const marked = new Marked();
      const html = marked.parse(spec.markdown, options);
      const isEqual = await htmlIsEqual(html, spec.html);
      if (!isEqual) {
        spec.shouldFail = true;
      }
      return spec;
    }));
    writeFileSync(resolve(dir, `./commonmark.${version}.json`), JSON.stringify(specs, null, 2) + '\n');
    console.log(`Saved CommonMark v${version} specs`);
  } catch (ex) {
    console.log(ex);
  }
}

async function updateGfm(dir) {
  try {
    const res = await fetch('https://github.github.com/gfm/');
    const html = await res.text();
    const $ = load(html);
    const version = $('.version').text().match(/\d+\.\d+/)[0];
    if (!version) {
      throw new Error('No version found');
    }
    let specs = [];
    $('.extension').each((i, ext) => {
      const section = $('.definition', ext).text().trim().replace(/^\d+\.\d+(.*?) \(extension\)[\s\S]*$/, '$1');
      $('.example', ext).each((j, exa) => {
        const example = +$(exa).attr('id').replace(/\D/g, '');
        const markdown = $('.language-markdown', exa).text().trim();
        const html = $('.language-html', exa).text().trim();
        specs.push({
          section: `[extension] ${section}`,
          html,
          markdown,
          example
        });
      });
    });

    specs = await Promise.all(specs.map(async(spec) => {
      const marked = new Marked();
      const html = marked.parse(spec.markdown, { gfm: true, pedantic: false });
      const isEqual = await htmlIsEqual(html, spec.html);
      if (!isEqual) {
        spec.shouldFail = true;
      }
      return spec;
    }));
    writeFileSync(resolve(dir, `./gfm.${version}.json`), JSON.stringify(specs, null, 2) + '\n');
    console.log(`Saved GFM v${version} specs.`);
  } catch (ex) {
    console.log(ex);
  }
}

const commonmarkDir = resolve(__dirname, './specs/commonmark');
const gfmDir = resolve(__dirname, './specs/gfm');
removeFiles(commonmarkDir);
removeFiles(gfmDir);
updateCommonmark(commonmarkDir, { gfm: false, pedantic: false });
updateCommonmark(gfmDir, { gfm: true, pedantic: false });
updateGfm(gfmDir);
