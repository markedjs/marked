const fetch = require('node-fetch');
const cheerio = require('cheerio');
const marked = require('../../../');
const htmlDiffer = require('../../helpers/html-differ.js');
const fs = require('fs');

fetch('https://github.github.com/gfm/')
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
    fs.writeFileSync(`gfm.${version}.json`, JSON.stringify(specs, null, 2) + '\n');
  })
  .catch((err) => {
    console.error(err);
  });
