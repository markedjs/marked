// eslint-disable-next-line @typescript-eslint/no-require-imports
const { marked } = require('../lib/marked.esm.js');

if (!marked.parse('# test').includes('<h1')) {
  throw new Error('Invalid markdown');
}
