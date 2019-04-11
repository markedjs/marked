const fetch = require('node-fetch');
const marked = require('../../../');
const htmlDiffer = require('../../helpers/html-differ.js');
const fs = require('fs');

fetch('https://raw.githubusercontent.com/commonmark/commonmark.js/master/package.json')
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
        fs.writeFileSync(`commonmark.${version}.json`, JSON.stringify(specs, null, 2) + '\n');
      })
  )
  .catch((err) => {
    console.error(err);
  });
