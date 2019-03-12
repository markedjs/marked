const marked = require('../../');
const HtmlDiffer = require('@markedjs/html-differ').HtmlDiffer;
const htmlDiffer = new HtmlDiffer({ignoreSelfClosingSlash: true});

const EXCERPT_LENGTH = 30;

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
            result.message = spec.markdown + '\n------\n\nExpected: Should Fail';
          } else {
            var expectedHtml = expected.replace(/\s/g, '');
            var actualHtml = actual.replace(/\s/g, '');

            for (var i = 0; i < expectedHtml.length; i++) {
              if (actualHtml[i] !== expectedHtml[i]) {
                actualHtml = actualHtml.substring(
                  Math.max(i - EXCERPT_LENGTH, 0),
                  Math.min(i + EXCERPT_LENGTH, actualHtml.length));

                expectedHtml = expectedHtml.substring(
                  Math.max(i - EXCERPT_LENGTH, 0),
                  Math.min(i + EXCERPT_LENGTH, expectedHtml.length));

                break;
              }
            }
            result.message = 'Expected:\n' + expectedHtml + '\n\nActual:\n' + actualHtml;
          }
          return result;
        }
      };
    }
  });
});
