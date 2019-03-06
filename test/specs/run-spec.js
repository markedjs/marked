const path = require('path');
const fs = require('fs');
const fm = require('front-matter');

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

          if (spec.file) {
            const markdown = fm(fs.readFileSync(path.resolve(__dirname, spec.file + '.md'), 'utf8'));
            spec.markdown = markdown.body;
            spec.html = fs.readFileSync(path.resolve(__dirname, spec.file + '.html'), 'utf8');
            if (Object.keys(markdown.attributes).length > 0) {
              spec.options = markdown.attributes;
            }
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

runSpecs('Marked', './marked.json');
runSpecs('GFM 0.28', './gfm.0.28.json', {gfm: true});
runSpecs('CommonMark 0.28', './commonmark.0.28.json', {headerIds: false});
runSpecs('Pedantic', './pedantic.json', {pedantic: true});
