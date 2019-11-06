const marked = require('../../src/marked.js');
const htmlDiffer = require('./html-differ.js');

beforeEach(() => {
  marked.setOptions(marked.getDefaults());

  jasmine.addAsyncMatchers({
    toRender: () => {
      return {
        compare: async(spec, expected) => {
          const result = {};
          const actual = marked(spec.markdown, spec.options);
          result.pass = await htmlDiffer.isEqual(expected, actual);

          if (result.pass) {
            result.message = `${spec.markdown}\n------\n\nExpected: Should Fail`;
          } else {
            const diff = await htmlDiffer.firstDiff(actual, expected);
            result.message = `Expected: ${diff.expected}\n  Actual: ${diff.actual}`;
          }
          return result;
        }
      };
    }
  });
});
