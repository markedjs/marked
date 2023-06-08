## Marked instance

By default, Marked stores options and extensions in the global scope. That means changing the options in one script will also change the options in another script since they share the same instance.

If you don't want to mutate global scope, you can create a new instance of Marked to ensure options and extensions are locally scoped.

```js
import { Marked } from 'marked';
const marked = new Marked([options, extension, ...]);
```

|Argument |Type    |Notes                                                                  |
|:--------|:-------|:----------------------------------------------------------------------|
| options |`object`|The same arguments that can be passed to [`marked.use`](/using_pro#use)|

## The `parse` function

```js
import { marked } from 'marked';
marked.parse(markdownString [,options])
```

|Argument                      |Type    |Notes                                                           |
|:-----------------------------|:-------|:---------------------------------------------------------------|
|markdownString                |`string`|String of markdown source to be compiled.                       |
|<a href="#options">options</a>|`object`|Hash of options. Can also use `marked.use` to set global options|

### Alternative using reference

```js
// Create reference instance
import { marked } from 'marked';

// Set options
marked.use({
  async: true,
  pedantic: false,
  gfm: true,
});

// Compile
console.log(marked.parse(markdownString));
```

<h2 id="options">Options</h2>

|Member      |Type      |Default  |Since    |Notes         |
|:-----------|:---------|:--------|:--------|:-------------|
|async       |`boolean` |`false`  |4.1.0    |If true, `walkTokens` functions can be async and `marked.parse` will return a promise that resolves when all walk tokens functions resolve.|
|breaks      |`boolean` |`false`  |v0.2.7   |If true, add `<br>` on a single line break (copies GitHub behavior on comments, but not on rendered markdown files). Requires `gfm` be `true`.|
|gfm         |`boolean` |`true`   |v0.2.1   |If true, use approved [GitHub Flavored Markdown (GFM) specification](https://github.github.com/gfm/).|
|pedantic    |`boolean` |`false`  |v0.2.1   |If true, conform to the original `markdown.pl` as much as possible. Don't fix original markdown bugs or behavior. Turns off and overrides `gfm`.|
|renderer    |`object`  |`new Renderer()`|v0.3.0|An object containing functions to render tokens to HTML. See [extensibility](/using_pro) for more details.|
|silent      |`boolean` |`false`  |v0.2.7   |If true, the parser does not throw any exception or log any warning. Any error will be returned as a string.|
|tokenizer    |`object`  |`new Tokenizer()`|v1.0.0|An object containing functions to create tokens from markdown. See [extensibility](/using_pro) for more details.|
|walkTokens   |`function`  |`null`|v1.1.0|A function which is called for every token. See [extensibility](/using_pro) for more details.|
|baseUrl (**deprecated**)|`string`  |`null`   |v0.3.9    |Deprecated in v5.0.0 use [`marked-base-url`](https://www.npmjs.com/package/marked-base-url) to prefix url for any relative link. |
|headerIds (**deprecated**)|`boolean` |`true`   |v0.4.0   |Deprecated in v5.0.0 use [`marked-gfm-heading-id`](https://www.npmjs.com/package/marked-gfm-heading-id) to include an `id` attribute when emitting headings (h1, h2, h3, etc).|
|headerPrefix (**deprecated**)|`string`  |`''`     |v0.3.0   |Deprecated in v5.0.0 use [`marked-gfm-heading-id`](https://www.npmjs.com/package/marked-gfm-heading-id) to add a string to prefix the `id` attribute when emitting headings (h1, h2, h3, etc).|
|highlight (**deprecated**)|`function`|`null`   |v0.3.0   |Deprecated in v5.0.0 use [`marked-highlight`](https://www.npmjs.com/package/marked-highlight) to add highlighting to code blocks. |
|langPrefix  (**deprecated**)|`string`  |`'language-'`|v0.3.0|Deprecated in v5.0.0 use [`marked-highlight`](https://www.npmjs.com/package/marked-highlight) to prefix the className in a `<code>` block. Useful for syntax highlighting.|
|mangle (**deprecated**)|`boolean` |`true`   |v0.3.4   |Deprecated in v5.0.0 use [`marked-mangle`](https://www.npmjs.com/package/marked-mangle) to mangle email addresses.|
|sanitize (**deprecated**)|`boolean` |`false`  |v0.2.1   |If true, sanitize the HTML passed into `markdownString` with the `sanitizer` function.<br>**Warning**: This feature is deprecated and it should NOT be used as it cannot be considered secure.<br>Instead use a sanitize library, like [DOMPurify](https://github.com/cure53/DOMPurify) (recommended), [sanitize-html](https://github.com/apostrophecms/sanitize-html) or [insane](https://github.com/bevacqua/insane) on the output HTML! |
|sanitizer  (**deprecated**)|`function`|`null`   |v0.3.4   |A function to sanitize the HTML passed into `markdownString`.|
|smartypants (**deprecated**)|`boolean` |`false`  |v0.2.9   |Deprecated in v5.0.0 use [`marked-smartypants`](https://www.npmjs.com/package/marked-smartypants) to use "smart" typographic punctuation for things like quotes and dashes.|
|xhtml (**deprecated**)|`boolean` |`false`  |v0.3.2   |Deprecated in v5.0.0 use [`marked-xhtml`](https://www.npmjs.com/package/marked-xhtml) to emit self-closing HTML tags for void elements (&lt;br/&gt;, &lt;img/&gt;, etc.) with a "/" as required by XHTML.|

<h2 id="extensions">Known Extensions</h2>

Marked can be extended using [custom extensions](/using_pro#extensions). This is a list of extensions that can be used with `marked.use(extension)`.

<!-- Keep this list ordered alphabetically by name -->

|Name|Package Name|Description|
|:---|:-----------|:----------|
|[Admonition](https://www.npmjs.com/package/marked-admonition-extension)|[`marked-admonition-extension`](https://www.npmjs.com/package/marked-admonition-extension)| Admonition extension |
|[Base URL](https://github.com/markedjs/marked-base-url)|[`marked-base-url`](https://www.npmjs.com/package/marked-base-url)|Prefix relative urls with a base URL.|
|[Bidi](https://github.com/markedjs/marked-bidi)|[`marked-bidi`](https://www.npmjs.com/package/marked-bidi)|Add Bidirectional text support to the HTML|
|[Custom Heading ID](https://github.com/markedjs/marked-custom-heading-id)|[`marked-custom-heading-id`](https://www.npmjs.com/package/marked-custom-heading-id)|Specify a custom heading id in headings with the [Markdown Extended Syntax](https://www.markdownguide.org/extended-syntax/#heading-ids) `# heading {#custom-id}`|
|[Emoji](https://github.com/UziTech/marked-emoji)|[`marked-emoji`](https://www.npmjs.com/package/marked-emoji)|Add emoji support like on GitHub|
|[Extended Tables](https://github.com/calculuschild/marked-extended-tables)|[`marked-extended-tables`](https://www.npmjs.com/package/marked-extended-tables)|Extends the standard Github-Flavored tables to support advanced features: Column Spanning, Row Spanning, Multi-row headers|
|[GFM Heading ID](https://github.com/markedjs/marked-gfm-heading-id)|[`marked-gfm-heading-id`](https://www.npmjs.com/package/marked-gfm-heading-id)|Use [`github-slugger`](https://github.com/Flet/github-slugger) to create the heading IDs and allow a custom prefix.|
|[Highlight](https://github.com/markedjs/marked-highlight)|[`marked-highlight`](https://www.npmjs.com/package/marked-highlight)|Highlight code blocks|
|[Katex Code](https://github.com/UziTech/marked-katex-extension)|[`marked-katex-extension`](https://www.npmjs.com/package/marked-katex-extension)|Render [katex](https://katex.org/) code|
|[LinkifyIt](https://github.com/UziTech/marked-linkify-it)|[`marked-linkify-it`](https://www.npmjs.com/package/marked-linkify-it)|Use [linkify-it](https://github.com/markdown-it/linkify-it) for urls|
|[Mangle](https://github.com/markedjs/marked-mangle)|[`marked-mangle`](https://www.npmjs.com/package/marked-mangle)|Mangle mailto links with HTML character references|
|[Misskey-flavored Markdown](https://akkoma.dev/sfr/marked-mfm)|[`marked-mfm`](https://www.npmjs.com/package/marked-mfm)|Custom extension for [Misskey-flavored Markdown](https://github.com/misskey-dev/mfm.js/blob/develop/docs/syntax.md).|
|[Smartypants](https://github.com/markedjs/marked-smartypants)|[`marked-smartypants`](https://www.npmjs.com/package/marked-smartypants)|Use [smartypants](https://www.npmjs.com/package/smartypants) to use "smart" typographic punctuation for things like quotes and dashes.|
|[XHTML](https://github.com/markedjs/marked-xhtml)|[`marked-xhtml`](https://www.npmjs.com/package/marked-xhtml)|Emit self-closing HTML tags for void elements (&lt;br/&gt;, &lt;img/&gt;, etc.) with a "/" as required by XHTML.|

<h2 id="inline">Inline Markdown</h2>

You can parse inline markdown by running markdown through `marked.parseInline`.

```js
const blockHtml = marked.parse('**strong** _em_');
console.log(blockHtml); // '<p><strong>strong</strong> <em>em</em></p>'

const inlineHtml = marked.parseInline('**strong** _em_');
console.log(inlineHtml); // '<strong>strong</strong> <em>em</em>'
```

<h2 id="highlight">Highlighting</h2>

Use [`marked-highlight`](https://www.npmjs.com/package/marked-highlight) to highlight code blocks.

<h2 id="workers">Workers</h2>

To prevent ReDoS attacks you can run marked on a worker and terminate it when parsing takes longer than usual.

Marked can be run in a [worker thread](https://nodejs.org/api/worker_threads.html) on a node server, or a [web worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) in a browser.

### Node Worker Thread

```js
// markedWorker.js

import { marked } from 'marked';
import { parentPort } from 'worker_threads';

parentPort.on('message', (markdownString) => {
  parentPort.postMessage(marked.parse(markdownString));
});
```

```js
// index.js

import { Worker } from 'worker_threads';
const markedWorker = new Worker('./markedWorker.js');

const markedTimeout = setTimeout(() => {
  markedWorker.terminate();
  throw new Error('Marked took too long!');
}, timeoutLimit);

markedWorker.on('message', (html) => {
  clearTimeout(markedTimeout);
  console.log(html);
  markedWorker.terminate();
});

markedWorker.postMessage(markdownString);
```

### Web Worker

> **NOTE**: Web Workers send the payload from `postMessage` in an object with the payload in a `.data` property

```js
// markedWorker.js

importScripts('path/to/marked.min.js');

onmessage = (e) => {
  const markdownString = e.data
  postMessage(marked.parse(markdownString));
};
```

```js
// script.js

const markedWorker = new Worker('./markedWorker.js');

const markedTimeout = setTimeout(() => {
  markedWorker.terminate();
  throw new Error('Marked took too long!');
}, timeoutLimit);

markedWorker.onmessage = (e) => {
  clearTimeout(markedTimeout);
  const html = e.data;
  console.log(html);
  markedWorker.terminate();
};

markedWorker.postMessage(markdownString);
```

<h2 id="cli-extensions">CLI Extensions</h2>

You can use extensions in the CLI by creating a new CLI that imports marked and the marked binary.

```js
// file: myMarked
#!/usr/bin/node

import { marked } from 'marked';
import customHeadingId from 'marked-custom-heading-id';

marked.use(customHeadingId());

import 'marked/bin/marked';
```

```sh
$ ./myMarked -s "# heading {#custom-id}"
<h1 id="custom-id">heading</h1>
```
