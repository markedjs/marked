## Extending Marked

To champion the single-responsibility and open/closed principles, we have tried to make it relatively painless to extend Marked. If you are looking to add custom functionality, this is the place to start.

<h2 id="use">marked.use()</h2>

`marked.use(extension)` is the recommended way to extend Marked. The `extension` object can contain any [option](/using_advanced#options) available in Marked:


```js
import { marked } from 'marked';

marked.use({
  pedantic: false,
  gfm: true,
  breaks: false
});
```

You can also supply multiple `extension` objects at once.

```js
marked.use(myExtension, extension2, extension3);

\\ EQUIVALENT TO:

marked.use(myExtension);
marked.use(extension2);
marked.use(extension3);
```

All options will overwrite those previously set, except for the following options which will be merged with the existing framework and can be used to change or extend the functionality of Marked: `renderer`, `tokenizer`, `hooks`, `walkTokens`, and `extensions`.

* The `renderer`, `tokenizer`, and `hooks` options are objects with functions that will be merged into the built-in `renderer` and `tokenizer` respectively.

* The `walkTokens` option is a function that will be called to post-process every token before rendering.

* The `extensions` option is an array of objects that can contain additional custom `renderer` and `tokenizer` steps that will execute before any of the default parsing logic occurs.

***

<h2>The Marked Pipeline</h2>

Before building your custom extensions, it is important to understand the components that Marked uses to translate from Markdown to HTML:

1) The user supplies Marked with an input string to be translated.
2) The `lexer` feeds segments of the input text string into each `tokenizer`, and from their output, generates a series of tokens in a nested tree structure.
3) Each `tokenizer` receives a segment of Markdown text and, if it matches a particular pattern, generates a token object containing any relevant information.
4) The `walkTokens` function will traverse every token in the tree and perform any final adjustments to the token contents.
4) The `parser` traverses the token tree and feeds each token into the appropriate `renderer`, and concatenates their outputs into the final HTML result.
5) Each `renderer` receives a token and manipulates its contents to generate a segment of HTML.

Marked provides methods for directly overriding the `renderer` and `tokenizer` for any existing token type, as well as inserting additional custom `renderer` and `tokenizer` functions to handle entirely custom syntax. For example, using `marked.use({renderer})` would modify a renderer, whereas `marked.use({extensions: [{renderer}]})` would add a new renderer. See the [custom extensions example](#custom-extensions-example) for insight on how to execute this.

***

<h2 id="renderer">The Renderer : <code>renderer</code></h2>

<!-- TODO: Remove this after next major version -->

🚨 Marked v13 changed the renderer to accept tokens. To opt in to these new renderer functions add `useNewRenderer: true` to the extension. See [the v13 release notes](https://github.com/markedjs/marked/releases/tag/v13.0.0) for an example 🚨

The renderer defines the HTML output of a given token. If you supply a `renderer` in the options object passed to `marked.use()`, any functions in the object will override the default handling of that token type.

Calling `marked.use()` to override the same function multiple times will give priority to the version that was assigned *last*. Overriding functions can return `false` to fall back to the previous override in the sequence, or resume default behavior if all overrides return `false`. Returning any other value (including nothing) will prevent fallback behavior.

**Example:** Overriding output of the default `heading` token by adding an embedded anchor tag like on GitHub.

```js
// Create reference instance
import { marked } from 'marked';

// Override function
const renderer = {
  heading(text, depth) {
    const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');

    return `
            <h${depth}>
              <a name="${escapedText}" class="anchor" href="#${escapedText}">
                <span class="header-link"></span>
              </a>
              ${text}
            </h${depth}>`;
  }
};

marked.use({ renderer });

// Run marked
console.log(marked.parse('# heading+'));
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
**Note:** Calling `marked.use()` in the following way will avoid overriding the `heading` token output but create a new `heading` renderer in the process.

```js
marked.use({
 extensions: [{
    name: 'heading',
    renderer(token) {
      return /* ... */
    }
  }]
})
```

### Block-level renderer methods

- <code>**space**(token: *Tokens.Space*): *string*</code>
- <code>**code**(token: *Tokens.Code*): *string*</code>
- <code>**blockquote**(token: *Tokens.Blockquote*): *string*</code>
- <code>**html**(token: *Tokens.HTML | Tokens.Tag*): *string*</code>
- <code>**heading**(token: *Tokens.Heading*): *string*</code>
- <code>**hr**(token: *Tokens.Hr*): *string*</code>
- <code>**list**(token: *Tokens.List*): *string*</code>
- <code>**listitem**(token: *Tokens.ListItem*): *string*</code>
- <code>**checkbox**(token: *Tokens.Checkbox*): *string*</code>
- <code>**paragraph**(token: *Tokens.Paragraph*): *string*</code>
- <code>**table**(token: *Tokens.Table*): *string*</code>
- <code>**tablerow**(token: *Tokens.TableRow*): *string*</code>
- <code>**tablecell**(token: *Tokens.TableCell*): *string*</code>

### Inline-level renderer methods

- <code>**strong**(token: *Tokens.Strong*): *string*</code>
- <code>**em**(token: *Tokens.Em*): *string*</code>
- <code>**codespan**(token: *Tokens.Codespan*): *string*</code>
- <code>**br**(token: *Tokens.Br*): *string*</code>
- <code>**del**(token: *Tokens.Del*): *string*</code>
- <code>**link**(token: *Tokens.Link*): *string*</code>
- <code>**image**(token: *Tokens.Image*): *string*</code>
- <code>**text**(token: *Tokens.Text | Tokens.Escape | Tokens.Tag*): *string*</code>

The Tokens.* properties can be found [here](https://github.com/markedjs/marked/blob/master/src/Tokens.ts).

***

<h2 id="tokenizer">The Tokenizer : <code>tokenizer</code></h2>

The tokenizer defines how to turn markdown text into tokens. If you supply a `tokenizer` object to the Marked options, it will be merged with the built-in tokenizer and any functions inside will override the default handling of that token type.

Calling `marked.use()` to override the same function multiple times will give priority to the version that was assigned *last*. Overriding functions can return `false` to fall back to the previous override in the sequence, or resume default behavior if all overrides return `false`. Returning any other value (including nothing) will prevent fallback behavior.

**Example:** Overriding default `codespan` tokenizer to include LaTeX.

```js
// Create reference instance
import { marked } from 'marked';

// Override function
const tokenizer = {
  codespan(src) {
    const match = src.match(/^\$+([^\$\n]+?)\$+/);
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
console.log(marked.parse('$ latex code $\n\n` other code `'));
```

**Output:**

```html
<p><code>latex code</code></p>
<p><code>other code</code></p>
```
**NOTE**: This does not fully support latex, see issue [#1948](https://github.com/markedjs/marked/issues/1948).

### Block level tokenizer methods

- <code>**space**(src: *string*): *Tokens.Space*</code>
- <code>**code**(src: *string*): *Tokens.Code*</code>
- <code>**fences**(src: *string*): *Tokens.Code*</code>
- <code>**heading**(src: *string*): *Tokens.Heading*</code>
- <code>**hr**(src: *string*): *Tokens.Hr*</code>
- <code>**blockquote**(src: *string*): *Tokens.Blockquote*</code>
- <code>**list**(src: *string*): *Tokens.List*</code>
- <code>**html**(src: *string*): *Tokens.HTML*</code>
- <code>**def**(src: *string*): *Tokens.Def*</code>
- <code>**table**(src: *string*): *Tokens.Table*</code>
- <code>**lheading**(src: *string*): *Tokens.Heading*</code>
- <code>**paragraph**(src: *string*): *Tokens.Paragraph*</code>
- <code>**text**(src: *string*): *Tokens.Text*</code>

### Inline level tokenizer methods

- <code>**escape**(src: *string*): *Tokens.Escape*</code>
- <code>**tag**(src: *string*): *Tokens.Tag*</code>
- <code>**link**(src: *string*): *Tokens.Link | Tokens.Image*</code>
- <code>**reflink**(src: *string*, links: *object*): *Tokens.Link | Tokens.Image | Tokens.Text*</code>
- <code>**emStrong**(src: *string*, maskedSrc: *string*, prevChar: *string*): *Tokens.Em | Tokens.Strong*</code>
- <code>**codespan**(src: *string*): *Tokens.Codespan*</code>
- <code>**br**(src: *string*): *Tokens.Br*</code>
- <code>**del**(src: *string*): *Tokens.Del*</code>
- <code>**autolink**(src: *string*): *Tokens.Link*</code>
- <code>**url**(src: *string*): *Tokens.Link*</code>
- <code>**inlineText**(src: *string*): *Tokens.Text*</code>

The Tokens.* properties can be found [here](https://github.com/markedjs/marked/blob/master/src/Tokens.ts).

***

<h2 id="walk-tokens">Walk Tokens : <code>walkTokens</code></h2>

The walkTokens function gets called with every token. Child tokens are called before moving on to sibling tokens. Each token is passed by reference so updates are persisted when passed to the parser. When [`async`](#async) mode is enabled, the return value is awaited. Otherwise the return value is ignored.

`marked.use()` can be called multiple times with different `walkTokens` functions. Each function will be called in order, starting with the function that was assigned *last*.

**Example:** Overriding heading tokens to start at h2.

```js
import { marked } from 'marked';

// Override function
const walkTokens = (token) => {
  if (token.type === 'heading') {
    token.depth += 1;
  }
};

marked.use({ walkTokens });

// Run marked
console.log(marked.parse('# heading 2\n\n## heading 3'));
```

**Output:**

```html
<h2 id="heading-2">heading 2</h2>
<h3 id="heading-3">heading 3</h3>
```

***

<h2 id="hooks">Hooks : <code>hooks</code></h2>

Hooks are methods that hook into some part of marked. The following hooks are available:

| signature | description |
|-----------|-------------|
| `preprocess(markdown: string): string` | Process markdown before sending it to marked. |
| `postprocess(html: string): string` | Process html after marked has finished parsing. |
| `processAllTokens(tokens: Token[]): Token[]` | Process all tokens before walk tokens. |

`marked.use()` can be called multiple times with different `hooks` functions. Each function will be called in order, starting with the function that was assigned *last*.

**Example:** Set options based on [front-matter](https://www.npmjs.com/package/front-matter)

```js
import { marked } from 'marked';
import fm from 'front-matter';

// Override function
function preprocess(markdown) {
  const { attributes, body } = fm(markdown);
  for (const prop in attributes) {
    if (prop in this.options) {
    this.options[prop] = attributes[prop];
    }
  }
  return body;
}

marked.use({ hooks: { preprocess } });

// Run marked
console.log(marked.parse(`
---
breaks: true
---

line1
line2
`.trim()));
```

**Output:**

```html
<p>line1<br>line2</p>
```

**Example:** Sanitize HTML with [isomorphic-dompurify](https://www.npmjs.com/package/isomorphic-dompurify)

```js
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

// Override function
function postprocess(html) {
  return DOMPurify.sanitize(html);
}

marked.use({ hooks: { postprocess } });

// Run marked
console.log(marked.parse(`
<img src=x onerror=alert(1)//>
`));
```

**Output:**

```html
<img src="x">
```

***

<h2 id="extensions">Custom Extensions : <code>extensions</code></h2>

You may supply an `extensions` array to the `options` object. This array can contain any number of `extension` objects, using the following properties:

<dl>
<dt><code><strong>name</strong></code></dt>
<dd>A string used to identify the token that will be handled by this extension.

If the name matches an existing extension name, or an existing method in the tokenizer/renderer methods listed above, they will override the previously assigned behavior, with priority on the extension that was assigned **last**. An extension can return `false` to fall back to the previous behavior.</dd>

<dt><code><strong>level</strong></code></dt>
<dd>A string to determine when to run the extension tokenizer. Must be equal to 'block' or 'inline'.

A **block-level** extension will be handled before any of the block-level tokenizer methods listed above, and generally consists of 'container-type' text (paragraphs, tables, blockquotes, etc.).

An **inline-level** extension will be handled inside each block-level token, before any of the inline-level tokenizer methods listed above. These generally consist of 'style-type' text (italics, bold, etc.).</dd>

<dt><code><strong>start</strong>(<i>string</i> src)</code></dt>
<dd>A function that returns the index of the next potential start of the custom token.

The index can be the result of a <code>src.match().index</code>, or even a simple <code>src.index()</code>. Marked will use this function to ensure that it does not skip over any text that should be part of the custom token.</dd>

<dt><code><strong>tokenizer</strong>(<i>string</i> src, <i>array</i> tokens)</code></dt>
<dd>A function that reads string of Markdown text and returns a generated token. The token pattern should be found at the beginning of the <code>src</code> string. Accordingly, if using a Regular Expression to detect a token, it should be anchored to the string start (`^`). The <code>tokens</code> parameter contains the array of tokens that have been generated by the lexer up to that point, and can be used to access the previous token, for instance.

The return value should be an object with the following parameters:

<dl>
<dt><code><strong>type</strong></code></dt>
<dd>A string that matches the <code>name</code> parameter of the extension.</dd>

<dt><code><strong>raw</strong></code></dt>
<dd>A string containing all of the text that this token consumes from the source.</dd>

<dt><code><strong>tokens</strong> [optional]</code></dt>
<dd>An array of child tokens that will be traversed by the <code>walkTokens</code> function by default.</dd>
</dl>

The returned token can also contain any other custom parameters of your choice that your custom `renderer` might need to access.

The tokenizer function has access to the lexer in the `this` object, which can be used if any internal section of the string needs to be parsed further, such as in handling any inline syntax on the text within a block token. The key functions that may be useful include:

<dl>
<dt><code><strong>this.lexer.blockTokens</strong>(<i>string</i> text, <i>array</i> tokens)</code></dt>
<dd>This runs the block tokenizer functions (including any block-level extensions) on the provided text, and appends any resulting tokens onto the <code>tokens</code> array. The <code>tokens</code> array is also returned by the function. You might use this, for example, if your extension creates a "container"-type token (such as a blockquote) that can potentially include other block-level tokens inside.</dd>

<dt><code><strong>this.lexer.inline</strong>(<i>string</i> text, <i>array</i> tokens)</code></dt>
<dd>Parsing of inline-level tokens only occurs after all block-level tokens have been generated. This function adds <code>text</code> and <code>tokens</code> to a queue to be processed using inline-level tokenizers (including any inline-level extensions) at that later step. Tokens will be generated using the provided <code>text</code>, and any resulting tokens will be appended to the <code>tokens</code> array. Note that this function does **NOT** return anything since the inline processing cannot happen until the block-level processing is complete.</dd>

<dt><code><strong>this.lexer.inlineTokens</strong>(<i>string</i> text, <i>array</i> tokens)</code></dt>
<dd>Sometimes an inline-level token contains further nested inline tokens (such as a <pre><code>**strong**</code></pre> token inside of a <pre><code>### Heading</code></pre>). This runs the inline tokenizer functions (including any inline-level extensions) on the provided text, and appends any resulting tokens onto the <code>tokens</code> array. The <code>tokens</code> array is also returned by the function.</dd>
</dl>
</dd>

<dt><code><strong>renderer</strong>(<i>object</i> token)</code></dt>
<dd>A function that reads a token and returns the generated HTML output string.

The renderer function has access to the parser in the `this` object, which can be used if any part of the token needs needs to be parsed further, such as any child tokens. The key functions that may be useful include:

<dl>
<dt><code><strong>this.parser.parse</strong>(<i>array</i> tokens)</code></dt>
<dd>Runs the block renderer functions (including any extensions) on the provided array of tokens, and returns the resulting HTML string output. This is used to generate the HTML from any child block-level tokens, for example if your extension is a "container"-type token (such as a blockquote) that can potentially include other block-level tokens inside.</dd>

<dt><code><strong>this.parser.parseInline</strong>(<i>array</i> tokens)</code></dt>
<dd>Runs the inline renderer functions (including any extensions) on the provided array of tokens, and returns the resulting HTML string output. This is used to generate the HTML from any child inline-level tokens.</dd>
</dl>
</dd>

<dt><code><strong>childTokens</strong> [optional]</code></dt>
<dd>An array of strings that match the names of any token parameters that should be traversed by the <code>walkTokens</code> functions. For instance, if you want to use a second custom parameter to contain child tokens in addition to <code>tokens</code>, it could be listed here. If <code>childTokens</code> is provided, the <code>tokens</code> array will not be walked by default unless it is also included in the <code>childTokens</code> array.</dd>
</dl>

**Example:** <a name="custom-extensions-example"></a>Add a custom syntax to generate `<dl>` description lists.

``` js
const descriptionList = {
  name: 'descriptionList',
  level: 'block',                                     // Is this a block-level or inline-level tokenizer?
  start(src) { return src.match(/:[^:\n]/)?.index; }, // Hint to Marked.js to stop and check for a match
  tokenizer(src, tokens) {
    const rule = /^(?::[^:\n]+:[^:\n]*(?:\n|$))+/;    // Regex for the complete token, anchor to string start
    const match = rule.exec(src);
    if (match) {
      const token = {                                 // Token to generate
        type: 'descriptionList',                      // Should match "name" above
        raw: match[0],                                // Text to consume from the source
        text: match[0].trim(),                        // Additional custom properties
        tokens: []                                    // Array where child inline tokens will be generated
      };
      this.lexer.inline(token.text, token.tokens);    // Queue this data to be processed for inline tokens
      return token;
    }
  },
  renderer(token) {
    return `<dl>${this.parser.parseInline(token.tokens)}\n</dl>`; // parseInline to turn child tokens into HTML
  }
};

const description = {
  name: 'description',
  level: 'inline',                                 // Is this a block-level or inline-level tokenizer?
  start(src) { return src.match(/:/)?.index; },    // Hint to Marked.js to stop and check for a match
  tokenizer(src, tokens) {
    const rule = /^:([^:\n]+):([^:\n]*)(?:\n|$)/;  // Regex for the complete token, anchor to string start
    const match = rule.exec(src);
    if (match) {
      return {                                         // Token to generate
        type: 'description',                           // Should match "name" above
        raw: match[0],                                 // Text to consume from the source
        dt: this.lexer.inlineTokens(match[1].trim()),  // Additional custom properties, including
        dd: this.lexer.inlineTokens(match[2].trim())   //   any further-nested inline tokens
      };
    }
  },
  renderer(token) {
    return `\n<dt>${this.parser.parseInline(token.dt)}</dt><dd>${this.parser.parseInline(token.dd)}</dd>`;
  },
  childTokens: ['dt', 'dd'],                 // Any child tokens to be visited by walkTokens
};

function walkTokens(token) {                        // Post-processing on the completed token tree
  if (token.type === 'strong') {
    token.text += ' walked';
    token.tokens = this.Lexer.lexInline(token.text)
  }
}
marked.use({ extensions: [descriptionList, description], walkTokens });

// EQUIVALENT TO:

marked.use({ extensions: [descriptionList] });
marked.use({ extensions: [description]     });
marked.use({ walkTokens })

console.log(marked.parse('A Description List:\n'
                 + ':   Topic 1   :  Description 1\n'
                 + ': **Topic 2** : *Description 2*'));
```

**Output**

``` bash
<p>A Description List:</p>
<dl>
<dt>Topic 1</dt><dd>Description 1</dd>
<dt><strong>Topic 2 walked</strong></dt><dd><em>Description 2</em></dd>
</dl>
```

***

<h2 id="async">Async Marked : <code>async</code></h2>

Marked will return a promise if the `async` option is true. The `async` option will tell marked to await any `walkTokens` functions before parsing the tokens and returning an HTML string.

Simple Example:

```js
const walkTokens = async (token) => {
  if (token.type === 'link') {
    try {
      await fetch(token.href);
    } catch (ex) {
      token.title = 'invalid';
    }
  }
};

marked.use({ walkTokens, async: true });

const markdown = `
[valid link](https://example.com)

[invalid link](https://invalidurl.com)
`;

const html = await marked.parse(markdown);
```

Custom Extension Example:

```js
const importUrl = {
  extensions: [{
    name: 'importUrl',
    level: 'block',
    start(src) { return src.indexOf('\n:'); },
    tokenizer(src) {
      const rule = /^:(https?:\/\/.+?):/;
      const match = rule.exec(src);
      if (match) {
        return {
          type: 'importUrl',
          raw: match[0],
          url: match[1],
          html: '' // will be replaced in walkTokens
        };
      }
    },
    renderer(token) {
      return token.html;
    }
  }],
  async: true, // needed to tell marked to return a promise
  async walkTokens(token) {
    if (token.type === 'importUrl') {
      const res = await fetch(token.url);
      token.html = await res.text();
    }
  }
};

marked.use(importUrl);

const markdown = `
# example.com

:https://example.com:
`;

const html = await marked.parse(markdown);
```

<h2 id="lexer">The Lexer</h2>

The lexer takes a markdown string and calls the tokenizer functions.


<h2 id="parser">The Parser</h2>

The parser takes tokens as input and calls the renderer functions.

<h2 id="extend">Access to Lexer and Parser</h2>

You also have direct access to the lexer and parser if you so desire. The lexer and parser options are the same as passed to `marked.setOptions()` except they have to be full options objects, they don't get merged with the current or default options.

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

Note that the lexer can be used in two different ways:

- `marked.lexer()`: this method tokenizes a string and returns its tokens. Subsequent calls to `lexer()` ignore any previous calls.
- `new marked.Lexer().lex()`: this instance tokenizes a string and returns its tokens along with any previous tokens. Subsequent calls to `lex()` accumulate tokens.

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
import { marked } from 'marked';

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
