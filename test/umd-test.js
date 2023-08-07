import '../lib/marked.umd.js';

// eslint-disable-next-line no-undef
if (!marked.parse('# test').includes('<h1')) {
  throw new Error('Invalid markdown');
}
