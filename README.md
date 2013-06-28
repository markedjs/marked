# marked

> A full-featured markdown parser and compiler, written in JavaScript. Built for speed.

[![NPM version](https://badge.fury.io/js/marked.png)](http://badge.fury.io/js/marked)  

## Install

``` bash
npm install marked --save
```

## Usage

Minimal usage:
```js
console.log(marked('I am using __markdown__.'));
// Outputs: <p>I am using <i>markdown</i>.</p>
```

Example using all options:
```js
// Set default options except highlight which has no default
marked.setOptions({
  gfm: true,
  highlight: function (code, lang, callback) {
    pygmentize({ lang: lang, format: 'html' }, code, function (err, result) {
      callback(err, result.toString());
    });
  },
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  smartypants: false,
  langPrefix: 'lang-'
});

console.log(marked('I am using __markdown__.'));
```

## marked(markdownString, [options], [callback])

### markdownString
Type: `String`

String of markdown source to be compiled.

### options
Type: `Object`

Hash of options. Can also be set using the `marked.setOptions` method as seen above.

### callback
Type: `Function`

Function called when the `markdownString` has been fully parsed. If the `options` argument is omitted, this can be used as the second argument as follows:
```js
marked(markdownString, function (err, content) {
  if (err) throw err;
  console.log(content);
  // Outputs parsed html
});
```
## Options

### gfm
Type: `Boolean`
Default: `true`

Enable [GitHub flavored markdown](https://help.github.com/articles/github-flavored-markdown).

### highlight
Type: `Function`

A function to highlight code blocks. The function takes three arguments: code, lang, and callback. The above example uses async highlighting with [node-pygementize-bundled](https://github.com/rvagg/node-pygmentize-bundled), and here is a synchronous example using [highlight.js](https://github.com/isagalaev/highlight.js) which doesn't require the callback argument:

```js
marked.setOptions({
  highlight: function (lang, code) {
    return hljs.highlightAuto(lang, code).value;
  }
});
```

#### highlight arguments
`code`

Type: `String`

The section of code to pass to the highlighter.

`lang`

Type: `String`

The programming language specified in the code block.

`callback`

Type: `String`

The callback function to call when using an async highlighter.

### tables
Type: `Boolean`
Default: `true`

Enable GFM [tables](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet#wiki-tables). This option requires the
  `gfm` option to be true.

### breaks
Type: `Boolean`
Default: `false`

Enable GFM [line breaks](https://help.github.com/articles/github-flavored-markdown#newlines). This option requires the
  `gfm` option to be true.

### pedantic
Type: `Boolean`
Default: `false`

Conform to obscure parts of `markdown.pl` as much as possible. Don't fix any of the original markdown bugs or poor behavior.

### sanitize
Type: `Boolean`
Default: `true`

Sanitize the output. Ignore any HTML that has been input.

### smartLists
Type: `Boolean`
Default: `true`

Use smarter list behavior than the original markdown.
  May eventually be default with the old behavior
  moved into `pedantic`.

### smartypants
Type: `Boolean`
Default: `false`

Use "smart" typograhic punctuation for things like quotes
  and dashes.

### langPrefix
Type: `String`
Default: `lang-`

Set the prefix for code block classes.

## Access to lexer and parser
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

## CLI

``` bash
$ marked -o hello.html
hello world
^D
$ cat hello.html
<p>hello world</p>
```

## Benchmarks

node v0.4.x

``` bash
$ node test --bench
marked completed in 12071ms.
showdown (reuse converter) completed in 27387ms.
showdown (new converter) completed in 75617ms.
markdown-js completed in 70069ms.
```

node v0.6.x

``` bash
$ node test --bench
marked completed in 6448ms.
marked (gfm) completed in 7357ms.
marked (pedantic) completed in 6092ms.
discount completed in 7314ms.
showdown (reuse converter) completed in 16018ms.
showdown (new converter) completed in 18234ms.
markdown-js completed in 24270ms.
```

__Marked is now faster than Discount, which is written in C.__

For those feeling skeptical: These benchmarks run the entire markdown test suite
1000 times. The test suite tests every feature. It doesn't cater to specific
aspects.

node v0.8.x

``` bash
$ node test --bench
marked completed in 3411ms.
marked (gfm) completed in 3727ms.
marked (pedantic) completed in 3201ms.
robotskirt completed in 808ms.
showdown (reuse converter) completed in 11954ms.
showdown (new converter) completed in 17774ms.
markdown-js completed in 17191ms.
```

## Another Javascript Markdown Parser

The point of marked was to create a markdown compiler where it was possible to
frequently parse huge chunks of markdown without having to worry about
caching the compiled output somehow...or blocking for an unnecesarily long time.

marked is very concise and still implements all markdown features. It is also
now fully compatible with the client-side.

marked more or less passes the official markdown test suite in its
entirety. This is important because a surprising number of markdown compilers
cannot pass more than a few tests. It was very difficult to get marked as
compliant as it is. It could have cut corners in several areas for the sake
of performance, but did not in order to be exactly what you expect in terms
of a markdown rendering. In fact, this is why marked could be considered at a
disadvantage in the benchmarks above.

Along with implementing every markdown feature, marked also implements
[GFM features](http://github.github.com/github-flavored-markdown/).

``` bash
$ node
> require('marked').lexer('> i am using marked.')
[ { type: 'blockquote_start' },
  { type: 'paragraph',
    text: 'i am using marked.' },
  { type: 'blockquote_end' },
  links: {} ]
```

## License

Copyright (c) 2011-2013, Christopher Jeffrey. (MIT License)

See LICENSE for more info.
