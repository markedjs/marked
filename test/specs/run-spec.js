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
          (spec.only ? fit : it)('should ' + (spec.shouldFail ? 'fail' : 'pass') + ' example ' + spec.example, () => {
            const before = process.hrtime();
            if (spec.shouldFail) {
              expect(spec).not.toRender(spec.html);
            } else {
              expect(spec).toRender(spec.html);
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

runSpecs('GFM', './gfm', true, {gfm: true});
runSpecs('CommonMark', './commonmark', true, {headerIds: false});
runSpecs('Original', './original', false, {gfm: false});
runSpecs('New', './new');
runSpecs('Redos', './redos');
