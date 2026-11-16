module.exports = {
  markdown: '    x\n>     y\n'.repeat(5000),
  html: '<pre><code>x\n</code></pre>\n<blockquote>\n<pre><code>y\n</code></pre>\n</blockquote>\n'.repeat(5000),
};
