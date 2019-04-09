const request = require('request-promise');
const marked = require('../../../');
const htmlDiffer = require('../../helpers/html-differ.js');
const fs = require("fs");

(async () => {
  const pkg = JSON.parse(await request('https://raw.githubusercontent.com/commonmark/commonmark.js/master/package.json'));
  const version = pkg.version.replace(/^(\d+\.\d+).*$/, '$1');
  const specs = JSON.parse(await request(`https://spec.commonmark.org/${version}/spec.json`));
  const newSpecs = specs.map((spec => {
    const newspec = {...spec};
    const html = marked(spec.markdown, {headerIds: false});
    if (!htmlDiffer.isEqual(html, spec.html)) {
      newspec.shouldFail = true;
    }
    return newspec;
  }));
  fs.writeFileSync(`commonmark.${version}.json`, JSON.stringify(newSpecs, null, 2) + '\n')
})().catch((err) => {
  console.error(err);
});
