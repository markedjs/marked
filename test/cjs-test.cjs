(async() => {
const { marked } = await import('../lib/marked.esm.js');

if (!marked.parse('# test').includes('<h1')) {
  throw new Error('Invalid markdown');
}
})();
