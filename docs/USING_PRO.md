## Extending Marked

To champion the single-responsibility and open/closed prinicples, we have tried to make it relatively painless to extend marked. If you are looking to add custom functionality, this is the place to start.

<h2 id="renderer">The renderer</h2>

The renderer is...

**Example:** Overriding default heading token by adding an embedded anchor tag like on GitHub.

```js
// Create reference instance
var myMarked = require('marked');

// Get reference
var renderer = new myMarked.Renderer();

// Override function
renderer.heading = function (text, level) {
  var escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');

  return `
          <h${level}>
            <a name="${escapedText}" class="anchor" href="#${escapedText}">
              <span class="header-link"></span>
            </a>
            ${text}
          </h${level}>`;
};

// Run marked
console.log(myMarked('# heading+', { renderer: renderer }));
```

**Output:**

```html
<h1>
  <a name="heading-" class="anchor" href="#heading-">
    <span class="header-link"></span>
  </a>
  heading+
</h1>
```

### Block level renderer methods

- code(*string* code, *string* infostring, *boolean* escaped)
- blockquote(*string* quote)
- html(*string* html)
- heading(*string* text, *number* level, *string* raw, *Slugger* slugger)
- hr()
- list(*string* body, *boolean* ordered, *number* start)
- listitem(*string* text, *boolean* task, *boolean* checked)
- checkbox(*boolean* checked)
- paragraph(*string* text)
- table(*string* header, *string* body)
- tablerow(*string* content)
- tablecell(*string* content, *object* flags)

`slugger` has the `slug` method to create an unique id from value:

```js
slugger.slug('foo')   // foo
slugger.slug('foo')   // foo-1
slugger.slug('foo')   // foo-2
slugger.slug('foo 1') // foo-1-1
slugger.slug('foo-1') // foo-1-2
...
```

`flags` has the following properties:

```js
{
    header: true || false,
    align: 'center' || 'left' || 'right'
}
```

### Inline level renderer methods

- strong(*string* text)
- em(*string* text)
- codespan(*string* code)
- br()
- del(*string* text)
- link(*string* href, *string* title, *string* text)
- image(*string* href, *string* title, *string* text)
- text(*string* text)

<h2 id="lexer">The lexer</h2>

The lexer is...


<h2 id="parser">The parser</h2>

The parser is...

***

<h2 id="extend">Access to lexer and parser</h2>

You also have direct access to the lexer and parser if you so desire.

``` js
var tokens = marked.lexer(text, options);
console.log(marked.parser(tokens));
```

``` js
var lexer = new marked.Lexer(options);
var tokens = lexer.lex(text);
console.log(tokens);
console.log(lexer.rules);
```

``` bash
$ node
> require('marked').lexer('> i am using marked.')
[ { type: 'blockquote_start' },
  { type: 'paragraph',
    text: 'i am using marked.' },
  { type: 'blockquote_end' },
  links: {} ]
```

The Lexers build an array of tokens, which will be passed to their respective
Parsers. The Parsers process each token in the token arrays,
which are removed from the array of tokens:

``` js
const marked = require('marked');

const md = `
  # heading

  [link][1]

  [1]: #heading "heading"
`;

const tokens = marked.lexer(md);
console.log(tokens);

const html = marked.parser(tokens);
console.log(html);

console.log(tokens);
```

``` bash
[ { type: 'heading', depth: 1, text: 'heading' },
  { type: 'paragraph', text: '  [link][1]' },
  { type: 'space' },
  links: { '1': { href: '#heading', title: 'heading' } } ]

<h1 id="heading">heading</h1>
<p>  <a href="#heading" title="heading">link</a></p>

[ links: { '1': { href: '#heading', title: 'heading' } } ]
```
