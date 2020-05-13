## The `marked` function

```js
marked(markdownString [,options] [,callback])
```

|Argument              |Type         |Notes                                                                                                |
|:---------------------|:------------|:----------------------------------------------------------------------------------------------------|
|markdownString        |`string`     |String of markdown source to be compiled.                                                            |
|<a href="#options">options</a>|`object`|Hash of options. Can also use `marked.setOptions`.                                                |
|callback              |`function`   |Called when `markdownString` has been parsed. Can be used as second argument if no `options` present.|

### Alternative using reference

```js
// Create reference instance
const marked = require('marked');

// Set options
// `highlight` example uses `highlight.js`
marked.setOptions({
  renderer: new marked.Renderer(),
  highlight: function(code, language) {
    const hljs = require('highlight.js');
    const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
    return hljs.highlight(validLanguage, code).value;
  },
  pedantic: false,
  gfm: true,
  breaks: false,
  sanitize: false,
  smartLists: true,
  smartypants: false,
  xhtml: false
});

// Compile
console.log(marked(markdownString));
```

<h2 id="options">Options</h2>

|Member      |Type      |Default  |Since    |Notes         |
|:-----------|:---------|:--------|:--------|:-------------|
|baseUrl     |`string`  |`null`   |0.3.9    |A prefix url for any relative link. |
|breaks      |`boolean` |`false`  |v0.2.7   |If true, add `<br>` on a single line break (copies GitHub behavior on comments, but not on rendered markdown files). Requires `gfm` be `true`.|
|gfm         |`boolean` |`true`   |v0.2.1   |If true, use approved [GitHub Flavored Markdown (GFM) specification](https://github.github.com/gfm/).|
|headerIds   |`boolean` |`true`   |v0.4.0   |If true, include an `id` attribute when emitting headings (h1, h2, h3, etc).|
|headerPrefix|`string`  |`''`     |v0.3.0   |A string to prefix the `id` attribute when emitting headings (h1, h2, h3, etc).|
|highlight   |`function`|`null`   |v0.3.0   |A function to highlight code blocks, see <a href="#highlight">Asynchronous highlighting</a>.|
|langPrefix  |`string`  |`'language-'`|v0.3.0|A string to prefix the className in a `<code>` block. Useful for syntax highlighting.|
|mangle      |`boolean` |`true`   |v0.3.4   |If true, autolinked email address is escaped with HTML character references.|
|pedantic    |`boolean` |`false`  |v0.2.1   |If true, conform to the original `markdown.pl` as much as possible. Don't fix original markdown bugs or behavior. Turns off and overrides `gfm`.|
|renderer    |`object`  |`new Renderer()`|v0.3.0|An object containing functions to render tokens to HTML. See [extensibility](/#/USING_PRO.md) for more details.|
|sanitize    |`boolean` |`false`  |v0.2.1   |If true, sanitize the HTML passed into `markdownString` with the `sanitizer` function.<br>**Warning**: This feature is deprecated and it should NOT be used as it cannot be considered secure.<br>Instead use a sanitize library, like [DOMPurify](https://github.com/cure53/DOMPurify) (recommended), [sanitize-html](https://github.com/apostrophecms/sanitize-html) or [insane](https://github.com/bevacqua/insane) on the output HTML! |
|sanitizer   |`function`|`null`   |v0.3.4   |A function to sanitize the HTML passed into `markdownString`.|
|silent      |`boolean` |`false`  |v0.2.7   |If true, the parser does not throw any exception.|
|smartLists  |`boolean` |`false`  |v0.2.8   |If true, use smarter list behavior than those found in `markdown.pl`.|
|smartypants |`boolean` |`false`  |v0.2.9   |If true, use "smart" typographic punctuation for things like quotes and dashes.|
|tokenizer    |`object`  |`new Tokenizer()`|v1.0.0|An object containing functions to create tokens from markdown. See [extensibility](/#/USING_PRO.md) for more details.|
|walkTokens   |`function`  |`null`|v1.1.0|A function which is called for every token. See [extensibility](/#/USING_PRO.md) for more details.|
|xhtml       |`boolean` |`false`  |v0.3.2   |If true, emit self-closing HTML tags for void elements (&lt;br/&gt;, &lt;img/&gt;, etc.) with a "/" as required by XHTML.|

<h2 id="highlight">Asynchronous highlighting</h2>

Unlike `highlight.js` the `pygmentize.js` library uses asynchronous highlighting. This example demonstrates that marked is agnostic when it comes to the highlighter you use.

```js
marked.setOptions({
  highlight: function(code, lang, callback) {
    require('pygmentize-bundled') ({ lang: lang, format: 'html' }, code, function (err, result) {
      callback(err, result.toString());
    });
  }
});

console.log(marked(markdownString));
```

In both examples, `code` is a `string` representing the section of code to pass to the highlighter. In this example, `lang` is a `string` informing the highlighter what programming language to use for the `code` and `callback` is the `function` the asynchronous highlighter will call once complete.

<h2 id="workers">Workers</h2>

To prevent ReDoS attacks you can run marked on a worker and terminate it when parsing takes longer than usual.

Marked can be run in a [worker thread](https://nodejs.org/api/worker_threads.html) on a node server, or a [web worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) in a browser.

### Node Worker Thread

```js
// markedWorker.js

const marked = require('marked');
const { parentPort } = require('worker_threads');

parentPort.on('message', (markdownString) => {
  parentPort.postMessage(marked(markdownString));
});
```

```js
// index.js

const { Worker } = require('worker_threads');
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
  postMessage(marked(markdownString));
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
