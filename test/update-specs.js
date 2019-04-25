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

function updateCommonmark(dir) {
  return fetch('https://raw.githubusercontent.com/commonmark/commonmark.js/master/package.json')
    .then(res => res.json())
    .then(pkg => pkg.version.replace(/^(\d+\.\d+).*$/, '$1'))
    .then(version =>
      fetch(`https://spec.commonmark.org/${version}/spec.json`)
        .then(res => res.json())
        .then(specs => {
          specs.forEach(spec => {
            const html = marked(spec.markdown, {headerIds: false});
            if (!htmlDiffer.isEqual(html, spec.html)) {
              spec.shouldFail = true;
            }
          });
          removeFiles(dir);
          fs.writeFileSync(path.resolve(dir, `./commonmark.${version}.json`), JSON.stringify(specs, null, 2) + '\n');
          console.log(`Saved CommonMark v${version} specs`);
        })
    )
    .catch((err) => {
      console.error(err);
    });
}

function updateGfm(dir) {
  return fetch('https://github.github.com/gfm/')
    .then(res => res.text())
    .then(html => cheerio.load(html))
    .then($ => {
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
            section,
            html,
            markdown,
            example
          });
        });
      });

      return [version, specs];
    })
    .then(([version, specs]) => {
      specs.forEach(spec => {
        const html = marked(spec.markdown, {gfm: true});
        if (!htmlDiffer.isEqual(html, spec.html)) {
          spec.shouldFail = true;
        }
      });
      removeFiles(dir);
      fs.writeFileSync(path.resolve(dir, `./gfm.${version}.json`), JSON.stringify(specs, null, 2) + '\n');
      console.log(`Saved GFM v${version} specs.`);
    })
    .catch((err) => {
      console.error(err);
    });
}

updateCommonmark(path.resolve(__dirname, './specs/commonmark'));
updateGfm(path.resolve(__dirname, './specs/gfm'));
