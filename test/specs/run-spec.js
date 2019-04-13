function runSpecs(title, file, options) {
  const json = require(file);
  let longestName = 0;
  let maxSpecs = 0;
  const specs = json.reduce((obj, spec) => {
    if (!obj[spec.section]) {
      longestName = Math.max(spec.section.length, longestName);
      obj[spec.section] = {
        specs: [],
        pass: 0,
        total: 0
      };
    }
    obj[spec.section].total++;
    maxSpecs = Math.max(obj[spec.section].total, maxSpecs);
    if (!spec.shouldFail) {
      obj[spec.section].pass++;
    }
    obj[spec.section].specs.push(spec);
    return obj;
  }, {});

  describe(title, () => {
    const maxSpecsLen = ('' + maxSpecs).length;
    const spaces = maxSpecsLen * 2 + longestName + 11;
    console.log('-'.padEnd(spaces + 4, '-'));
    console.log(`| ${title.padStart(Math.ceil((spaces + title.length) / 2)).padEnd(spaces)} |`);
    console.log(`| ${' '.padEnd(spaces)} |`);
    Object.keys(specs).forEach(section => {
      console.log(`| ${section.padEnd(longestName)} ${('' + specs[section].pass).padStart(maxSpecsLen)} of ${('' + specs[section].total).padStart(maxSpecsLen)} ${(100 * specs[section].pass / specs[section].total).toFixed().padStart(4)}% |`);
      describe(section, () => {
        specs[section].specs.forEach((spec) => {
          if (options) {
            spec.options = Object.assign({}, options, (spec.options || {}));
          }
          (spec.only ? fit : it)('should ' + (spec.shouldFail ? 'fail' : 'pass') + ' example ' + spec.example, () => {
            if (spec.shouldFail) {
              expect(spec).not.toRender(spec.html);
            } else {
              expect(spec).toRender(spec.html);
            }
          });
        });
      });
    });
    console.log('-'.padEnd(spaces + 4, '-'));
    console.log();
  });
};

runSpecs('GFM 0.29', './gfm/gfm.0.29.json', {gfm: true});
runSpecs('CommonMark 0.29', './commonmark/commonmark.0.29.json', {headerIds: false});
