const fetch = require('node-fetch');
const cheerio = require('cheerio');
const marked = require('../');
const htmlDiffer = require('./helpers/html-differ.js');
const fs = require('fs');
const path = require('path');

function removeFiles(dir) {
  fs.readdirSync(dir).forEach(file => {
    fs.unlinkSync(path.join(dir, file));
  });
}

async function updateCommonmark(dir, options) {
  try {
    const res = await fetch('https://raw.githubusercontent.com/commonmark/commonmark.js/master/package.json');
    const pkg = await res.json();
    const version = pkg.version.replace(/^(\d+\.\d+).*$/, '$1');
    const res2 = await fetch(`https://spec.commonmark.org/${version}/spec.json`);
    const specs = await res2.json();
    specs.forEach(spec => {
      const html = marked(spec.markdown, options);
      if (!htmlDiffer.isEqual(html, spec.html)) {
        spec.shouldFail = true;
      }
    });
    fs.writeFileSync(path.resolve(dir, `./commonmark.${version}.json`), JSON.stringify(specs, null, 2) + '\n');
    console.log(`Saved CommonMark v${version} specs`);
  } catch (ex) {
    console.log(ex);
  }
}

async function updateGfm(dir) {
  try {
    const res = await fetch('https://github.github.com/gfm/');
    const html = await res.text();
    const $ = cheerio.load(html);
    const version = $('.version').text().match(/\d+\.\d+/)[0];
    if (!version) {
      throw new Error('No version found');
    }
    const specs = [];
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

    specs.forEach(spec => {
      const html = marked(spec.markdown, { gfm: true, pedantic: false });
      if (!htmlDiffer.isEqual(html, spec.html)) {
        spec.shouldFail = true;
      }
    });
    fs.writeFileSync(path.resolve(dir, `./gfm.${version}.json`), JSON.stringify(specs, null, 2) + '\n');
    console.log(`Saved GFM v${version} specs.`);
  } catch (ex) {
    console.log(ex);
  }
}

const commonmarkDir = path.resolve(__dirname, './specs/commonmark');
const gfmDir = path.resolve(__dirname, './specs/gfm');
removeFiles(commonmarkDir);
removeFiles(gfmDir);
updateCommonmark(commonmarkDir, { gfm: false, pedantic: false, headerIds: false });
updateCommonmark(gfmDir, { gfm: true, pedantic: false, headerIds: false });
updateGfm(gfmDir);
