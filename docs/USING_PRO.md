## Extending Marked

To champion the single-responsibility and open/closed principles, we have tried to make it relatively painless to extend marked. If you are looking to add custom functionality, this is the place to start.

<h2 id="use">marked.use()</h2>

`marked.use(options)` is the recommended way to extend marked. The options object can contain any [option](#/USING_ADVANCED.md#options) available in marked.

The `renderer` and `tokenizer` options can be an object with functions that will be merged into the `renderer` and `tokenizer` respectively.

The `renderer` and `tokenizer` functions can return false to fallback to the previous function.

The `walkTokens` option can be a function that will be called with every token before rendering. When calling `use` multiple times with different `walkTokens` functions each function will be called in the **reverse** order in which they were assigned.

All other options will overwrite previously set options.

<h2 id="renderer">The renderer</h2>

The renderer defines the output of the parser.

**Example:** Overriding default heading token by adding an embedded anchor tag like on GitHub.

```js
// Create reference instance
const marked = require('marked');

// Override function
const renderer = {
  heading(text, level) {
    const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');

    return `
            <h${level}>
              <a name="${escapedText}" class="anchor" href="#${escapedText}">
                <span class="header-link"></span>
              </a>
              ${text}
            </h${level}>`;
  }
};

marked.use({ renderer });

// Run marked
console.log(marked('# heading+'));
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

**Example:** Overriding default `codespan` tokenizer to include LaTeX.

```js
// Create reference instance
const marked = require('marked');

// Override function
const tokenizer = {
  codespan(src) {
    const match = src.match(/\$+([^\$\n]+?)\$+/);
    if (match) {
      return {
        type: 'codespan',
        raw: match[0],
        text: match[1].trim()
      };
    }

    // return false to use original codespan tokenizer
    return false;
  }
};

marked.use({ tokenizer });

// Run marked
console.log(marked('$ latex code $\n\n` other code `'));
```

**Output:**

```html
<p><code>latex code</code></p>
<p><code>other code</code></p>
```

### Block level tokenizer methods

- space(*string* src)
- code(*string* src, *array* tokens)
- fences(*string* src)
- heading(*string* src)
- nptable(*string* src)
- hr(*string* src)
- blockquote(*string* src)
- list(*string* src)
- html(*string* src)
- def(*string* src)
- table(*string* src)
- lheading(*string* src)
- paragraph(*string* src)
- text(*string* src, *array* tokens)

### Inline level tokenizer methods

- escape(*string* src)
- tag(*string* src, *bool* inLink, *bool* inRawBlock)
- link(*string* src)
- reflink(*string* src, *object* links)
- strong(*string* src)
- em(*string* src)
- codespan(*string* src)
- br(*string* src)
- del(*string* src)
- autolink(*string* src, *function* mangle)
- url(*string* src, *function* mangle)
- inlineText(*string* src, *bool* inRawBlock, *function* smartypants)

`mangle` is a method that changes text to HTML character references:

```js
mangle('test@example.com')
// "&#x74;&#101;&#x73;&#116;&#x40;&#101;&#120;&#x61;&#x6d;&#112;&#108;&#101;&#46;&#x63;&#111;&#x6d;"
```

`smartypants` is a method that translates plain ASCII punctuation characters into “smart” typographic punctuation HTML entities:

https://daringfireball.net/projects/smartypants/

```js
smartypants('"this ... string"')
// "“this … string”"
```

<h2 id="walk-tokens">Walk Tokens</h2>

The walkTokens function gets called with every token. Child tokens are called before moving on to sibling tokens. Each token is passed by reference so updates are persisted when passed to the parser. The return value of the function is ignored.

**Example:** Overriding heading tokens to start at h2.

```js
const marked = require('marked');

// Override function
const walkTokens = (token) => {
  if (token.type === 'heading') {
    token.depth += 1;
  }
};

marked.use({ walkTokens });

// Run marked
console.log(marked('# heading 2\n\n## heading 3'));
```

**Output:**

```html
<h2 id="heading-2">heading 2</h2>
<h3 id="heading-3">heading 3</h3>
```

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
console.log(lexer.tokenizer.rules.block); // block level rules used
console.log(lexer.tokenizer.rules.inline); // inline level rules used
console.log(marked.Lexer.rules.block); // all block level rules
console.log(marked.Lexer.rules.inline); // all inline level rules
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
