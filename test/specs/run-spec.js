const path = require('path');
const load = require('../helpers/load.js');

function runSpecs(title, dir, showCompletionTable, options) {
  options = options || {};
  const specs = load.loadFiles(path.resolve(__dirname, dir));

  if (showCompletionTable) {
    load.outputCompletionTable(title, specs);
  }

  describe(title, () => {
    Object.keys(specs).forEach(section => {
      describe(section, () => {
        specs[section].specs.forEach((spec) => {
          spec.options = Object.assign({}, options, (spec.options || {}));
          const example = (spec.example ? ' example ' + spec.example : '');
          const passFail = (spec.shouldFail ? 'fail' : 'pass');

          (spec.only ? fit : (spec.skip ? xit : it))('should ' + passFail + example, async() => {
            const before = process.hrtime();
            if (spec.shouldFail) {
              await expectAsync(spec).not.toRender(spec.html);
            } else if (spec.options.renderExact) {
              await expectAsync(spec).toRenderExact(spec.html);
            } else {
              await expectAsync(spec).toRender(spec.html);
            }
            const elapsed = process.hrtime(before);
            if (elapsed[0] > 0) {
              const s = (elapsed[0] + elapsed[1] * 1e-9).toFixed(3);
              fail(`took too long: ${s}s`);
            }
          });
        });
      });
    });
  });
}

runSpecs('GFM', './gfm', true, { gfm: true, pedantic: false, hooks: { headerId: false } });
runSpecs('CommonMark', './commonmark', true, { gfm: false, pedantic: false, hooks: { headerId: false } });
runSpecs('Original', './original', false, { gfm: false, pedantic: true, hooks: { headerId: false } });
runSpecs('New', './new');
runSpecs('ReDOS', './redos');
