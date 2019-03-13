const marked = require('../../');
const htmlDiffer = require('./html-differ.js');

beforeEach(() => {
  marked.setOptions(marked.getDefaults());

  jasmine.addMatchers({
    toRender: () => {
      return {
        compare: (spec, expected) => {
          const result = {};
          const actual = marked(spec.markdown, spec.options);
          result.pass = htmlDiffer.isEqual(expected, actual);

          if (result.pass) {
            result.message = `${spec.markdown}\n------\n\nExpected: Should Fail`;
          } else {
            const diff = htmlDiffer.firstDiff(actual, expected);
            result.message = `Expected: ${diff.expected}\n  Actual: ${diff.actual}`;
          }
          return result;
        }
      };
    }
  });
});
