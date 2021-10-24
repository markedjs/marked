import { marked, setOptions, getDefaults } from '../../src/marked.js';
import { isEqual, firstDiff } from './html-differ.js';
import { strictEqual } from 'assert';

beforeEach(() => {
  setOptions(getDefaults());

  jasmine.addAsyncMatchers({
    toRender: () => {
      return {
        compare: async(spec, expected) => {
          const result = {};
          const actual = marked(spec.markdown, spec.options);
          result.pass = await isEqual(expected, actual);

          if (result.pass) {
            result.message = `${spec.markdown}\n------\n\nExpected: Should Fail`;
          } else {
            const diff = await firstDiff(actual, expected);
            result.message = `Expected: ${diff.expected}\n  Actual: ${diff.actual}`;
          }
          return result;
        }
      };
    },
    toEqualHtml: () => {
      return {
        compare: async(actual, expected) => {
          const result = {};
          result.pass = await isEqual(expected, actual);

          if (result.pass) {
            result.message = `Expected '${actual}' not to equal '${expected}'`;
          } else {
            const diff = await firstDiff(actual, expected);
            result.message = `Expected: ${diff.expected}\n  Actual: ${diff.actual}`;
          }
          return result;
        }
      };
    },
    toRenderExact: () => ({
      compare: async(spec, expected) => {
        const result = {};
        const actual = marked(spec.markdown, spec.options);

        result.pass = strictEqual(expected, actual) === undefined;

        return result;
      }
    })
  });
});
