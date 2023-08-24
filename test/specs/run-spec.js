import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { loadFiles, outputCompletionTable } from '../helpers/load.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function runSpecs(title, dir, showCompletionTable, options) {
  options = options || {};
  const specs = loadFiles(resolve(__dirname, dir));

  if (showCompletionTable) {
    outputCompletionTable(title, specs);
  }

  describe(title, () => {
    Object.keys(specs).forEach(section => {
      describe(section, () => {
        specs[section].specs.forEach((spec) => {
          spec.options = Object.assign({}, options, (spec.options || {}));
          const example = (spec.example ? ' example ' + spec.example : '');
          const passFail = (spec.shouldFail ? 'fail' : 'pass');

          if (typeof spec.options.silent === 'undefined') {
            spec.options.silent = true;
          }

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

runSpecs('GFM', './gfm', true, { gfm: true, pedantic: false });
runSpecs('CommonMark', './commonmark', true, { gfm: false, pedantic: false });
runSpecs('Original', './original', false, { gfm: false, pedantic: true });
runSpecs('New', './new');
runSpecs('ReDOS', './redos');
