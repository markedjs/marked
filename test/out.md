<h1>A heading</h1>
<p>Just a note, I've found that I can't test my markdown parser vs others. For example, both markdown.js and showdown code blocks in lists wrong. They're  also completely <a href="http://google.com/" title="Google">inconsistent</a> with regards to paragraphs in list items.</p>
<p>A link</p>
<aside>this will make me fail the test because
markdown.js doesnt acknowledge arbitrary html blocks =/</aside>
<ul><li>List Item 1</li><li>List Item 2 <ul><li>New List Item 1 Hi, this is a list item.</li><li>New List Item 2 Another item <pre><code>Code goes here.
Lots of it...</code></pre></li><li>New List Item 3 The last item</li></ul></li><li>List Item 3 The final item.</li></ul>
<blockquote><ul><li>bq Item 1</li><li>bq Item 2 <ul><li>New bq Item 1</li><li>New bq Item 2 Text here</li></ul></li></ul></blockquote>
<blockquote><p> Another blockquote  To quoth someone  and whatnot  markdown.js breaks here again</p></blockquote>
<h2>Another Heading</h2>
<p>Hello <em>world</em>. Here is a <a href="//hello">link</a>. And an image <img src="src" alt="alt">.</p>
<pre><code>Code goes here.
Lots of it...</code></pre>