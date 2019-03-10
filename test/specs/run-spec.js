function runSpecs(title, file, options) {
  const json = require(file);
  const specs = json.reduce((obj, spec) => {
    if (!obj[spec.section]) {
      obj[spec.section] = [];
    }
    obj[spec.section].push(spec);
    return obj;
  }, {});

  describe(title, function() {
    Object.keys(specs).forEach(section => {
      describe(section, function() {
        specs[section].forEach(function(spec) {
          if (options) {
            spec.options = Object.assign({}, options, (spec.options || {}));
          }
          (spec.only ? fit : it)('should ' + (spec.shouldFail ? 'fail' : 'pass') + ' example ' + spec.example, function() {
            if (spec.shouldFail) {
              expect(spec).not.toRender(spec.html);
            } else {
              expect(spec).toRender(spec.html);
            }
          });
        });
      });
    });
  });
};

runSpecs('GFM 0.28', './gfm/gfm.0.28.json', {gfm: true});
runSpecs('CommonMark 0.28', './commonmark/commonmark.0.28.json', {headerIds: false});
