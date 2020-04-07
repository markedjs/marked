## Extending Marked

To champion the single-responsibility and open/closed principles, we have tried to make it relatively painless to extend marked. If you are looking to add custom functionality, this is the place to start.

<h2 id="renderer">The renderer</h2>

The renderer defines the output of the parser.

**Example:** Overriding default heading token by adding an embedded anchor tag like on GitHub.

```js
// Create reference instance
const marked = require('marked');

// Get reference
const renderer = new marked.Renderer();

// Override function
renderer.heading = function(text, level) {
  const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');

  return `
          <h${level}>
            <a name="${escapedText}" class="anchor" href="#${escapedText}">
              <span class="header-link"></span>
            </a>
            ${text}
          </h${level}>`;
};

// Run marked
console.log(marked('# heading+', { renderer }));
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

`slugger` has the `slug` method to create a unique id from value:

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

<h2 id="tokenizer">The tokenizer</h2>

The tokenizer defines how to turn markdown text into tokens.

**Example:** Overriding default `codespan` tokenizer to include latex.

```js
// Create reference instance
const marked = require('marked');

// Get reference
const tokenizer = new marked.Tokenizer();
const originalCodespan = tokenizer.codespan;
// Override function
tokenizer.codespan = function(lexer, src) {
  const match = src.match(/\$+([^\$\n]+?)\$+/);
  if (match) {
    return {
      type: 'codespan',
      raw: match[0],
      text: match[1].trim()
    };
  }
  return originalCodespan.apply(this, arguments);
};

// Run marked
console.log(marked('$ latext code $', { tokenizer }));
```

**Output:**

```html
<p><code>latext code</code></p>
```

### Block level tokenizer methods

- space(*Lexer* lexer, *string* src, *array* tokens, *bool* top)
- code(*Lexer* lexer, *string* src, *array* tokens, *bool* top)
- fences(*Lexer* lexer, *string* src, *array* tokens, *bool* top)
- heading(*Lexer* lexer, *string* src, *array* tokens, *bool* top)
- nptable(*Lexer* lexer, *string* src, *array* tokens, *bool* top)
- hr(*Lexer* lexer, *string* src, *array* tokens, *bool* top)
- blockquote(*Lexer* lexer, *string* src, *array* tokens, *bool* top)
- list(*Lexer* lexer, *string* src, *array* tokens, *bool* top)
- html(*Lexer* lexer, *string* src, *array* tokens, *bool* top)
- def(*Lexer* lexer, *string* src, *array* tokens, *bool* top)
- table(*Lexer* lexer, *string* src, *array* tokens, *bool* top)
- lheading(*Lexer* lexer, *string* src, *array* tokens, *bool* top)
- paragraph(*Lexer* lexer, *string* src, *array* tokens, *bool* top)
- text(*Lexer* lexer, *string* src, *array* tokens, *bool* top)

### Inline level tokenizer methods

- escape(*Lexer* lexer, *string* src, *array* tokens)
- tag(*Lexer* lexer, *string* src, *array* tokens)
- link(*Lexer* lexer, *string* src, *array* tokens)
- reflink(*Lexer* lexer, *string* src, *array* tokens)
- strong(*Lexer* lexer, *string* src, *array* tokens)
- em(*Lexer* lexer, *string* src, *array* tokens)
- codespan(*Lexer* lexer, *string* src, *array* tokens)
- br(*Lexer* lexer, *string* src, *array* tokens)
- del(*Lexer* lexer, *string* src, *array* tokens)
- autolink(*Lexer* lexer, *string* src, *array* tokens)
- url(*Lexer* lexer, *string* src, *array* tokens)
- inlineText(*Lexer* lexer, *string* src, *array* tokens)

### Other tokenizer methods

- smartypants(*string* text)
- mangle(*string* text)

<h2 id="lexer">The lexer</h2>

The lexer takes a markdown string and calls the tokenizer functions.

<h2 id="parser">The parser</h2>

The parser takes tokens as input and calls the renderer functions.

***

<h2 id="extend">Access to lexer and parser</h2>

You also have direct access to the lexer and parser if you so desire.

``` js
const tokens = marked.lexer(markdown, options);
console.log(marked.parser(tokens, options));
```

``` js
const lexer = new marked.Lexer(options);
const tokens = lexer.lex(markdown);
console.log(tokens);
console.log(lexer.rules.block); // block level rules
console.log(lexer.rules.inline); // inline level rules
```

``` bash
$ node
> require('marked').lexer('> I am using marked.')
[
  {
    type: "blockquote",
    raw: "> I am using marked.",
    tokens: [
      {
        type: "paragraph",
        raw: "I am using marked.",
        text: "I am using marked.",
        tokens: [
          {
            type: "text",
            raw: "I am using marked.",
            text: "I am using marked."
          }
        ]
      }
    ]
  },
  links: {}
]
```

The Lexer builds an array of tokens, which will be passed to the Parser.
The Parser processes each token in the token array:

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
```

``` bash
[
  {
    type: "heading",
    raw: "  # heading\n\n",
    depth: 1,
    text: "heading",
    tokens: [
      {
        type: "text",
        raw: "heading",
        text: "heading"
      }
    ]
  },
  {
    type: "paragraph",
    raw: "  [link][1]",
    text: "  [link][1]",
    tokens: [
      {
        type: "text",
        raw: "  ",
        text: "  "
      },
      {
        type: "link",
        raw: "[link][1]",
        text: "link",
        href: "#heading",
        title: "heading",
        tokens: [
          {
            type: "text",
            raw: "link",
            text: "link"
          }
        ]
      }
    ]
  },
  {
    type: "space",
    raw: "\n\n"
  },
  links: {
    "1": {
      href: "#heading",
      title: "heading"
    }
  }
]
<h1 id="heading">heading</h1>
<p>  <a href="#heading" title="heading">link</a></p>
```
