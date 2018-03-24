var marked = require('../../marked.min.js');

// cm_tabs.js
it('should pass cm example 1', function() {
  var result = marked('\tfoo\tbaz\t\tbim\n');
  var expected = '<pre><code>foo\tbaz\t\tbim\n</code></pre>\n';

  expected(result).toBe(expected);
}

// cm_tabs.js
it('should pass cm example 2', function() {
  var result = marked('  \tfoo\tbaz\t\tbim\n');
  var expected = '<pre><code>foo\tbaz\t\tbim\n</code></pre>\n';

  expected(result).toBe(expected);
}

// cm_tabs.js
it('should pass cm example 3', function() {
  var result = marked('    a\ta\n    ὐ\ta\n');
  var expected = '<pre><code>a\ta\nὐ\ta\n</code></pre>\n';

  expected(result).toBe(expected);
}

// cm_tabs.js
it('should pass cm example 4', function() {
  var result = marked('  - foo\n\n\tbar\n');
  var expected = '<ul>\n<li>\n<p>foo</p>\n<p>bar</p>\n</li>\n</ul>\n';

  expected(result).toBe(expected);
}

// cm_tabs.js
it('should pass cm example 5', function() {
  var result = marked('- foo\n\n\t\tbar\n');
  var expected = '<ul>\n<li>\n<p>foo</p>\n<pre><code>  bar\n</code></pre>\n</li>\n</ul>\n';

  expected(result).toBe(expected);
}

// cm_tabs.js
it('should pass cm example 6', function() {
  var result = marked('>\t\tfoo\n');
  var expected = '<blockquote>\n<pre><code>  foo\n</code></pre>\n</blockquote>\n';

  expected(result).toBe(expected);
}

// cm_tabs.js
it('should pass cm example 7', function() {
  var result = marked('-\t\tfoo\n');
  var expected = '<ul>\n<li>\n<pre><code>  foo\n</code></pre>\n</li>\n</ul>\n';

  expected(result).toBe(expected);
}

// cm_tabs.js
it('should pass cm example 8', function() {
  var result = marked('    foo\n\tbar\n');
  var expected = '<pre><code>foo\nbar\n</code></pre>\n';

  expected(result).toBe(expected);
}

// cm_tabs.js
it('should pass cm example 9', function() {
  var result = marked(' - foo\n   - bar\n\t - baz\n');
  var expected = '<ul>\n<li>foo\n<ul>\n<li>bar\n<ul>\n<li>baz</li>\n</ul>\n</li>\n</ul>\n</li>\n</ul>\n';

  expected(result).toBe(expected);
}

// cm_tabs.js
it('should pass cm example 10', function() {
  var result = marked('#\tFoo\n');
  var expected = '<h1>Foo</h1>\n';

  expected(result).toBe(expected);
}

// cm_tabs.js
it('should pass cm example 11', function() {
  var result = marked('*\t*\t*\t\n');
  var expected = '<hr />\n';

  expected(result).toBe(expected);
}