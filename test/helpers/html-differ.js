const HtmlDiffer = require('@markedjs/html-differ').HtmlDiffer;
const htmlDiffer = new HtmlDiffer({
  ignoreSelfClosingSlash: true,
  ignoreComments: false
});

module.exports = {
  isEqual: htmlDiffer.isEqual.bind(htmlDiffer),
  firstDiff: async(actual, expected, padding) => {
    padding = padding || 30;
    const diffHtml = await htmlDiffer.diffHtml(actual, expected);
    const result = diffHtml.reduce((obj, diff) => {
      if (diff.added) {
        if (obj.firstIndex === null) {
          obj.firstIndex = obj.expected.length;
        }
        obj.expected += diff.value;
      } else if (diff.removed) {
        if (obj.firstIndex === null) {
          obj.firstIndex = obj.actual.length;
        }
        obj.actual += diff.value;
      } else {
        obj.actual += diff.value;
        obj.expected += diff.value;
      }

      return obj;
    }, {
      firstIndex: null,
      actual: '',
      expected: ''
    });

    return {
      actual: result.actual.substring(result.firstIndex - padding, result.firstIndex + padding),
      expected: result.expected.substring(result.firstIndex - padding, result.firstIndex + padding)
    };
  }
};
