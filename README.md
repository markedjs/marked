# marked

> A full-featured markdown parser and compiler, written in JavaScript. Built
> for speed.

[![NPM version](https://badge.fury.io/js/marked.svg)][badge]

<ul>
  <li><a href="#install">Installation</a></li>
  <li><a href="#usage">Usage</a></li>
  <li><a href="#marked-call"><code>marked()</code></a></li>
  <li><a href="#options">Options</a></li>
  <li><a href="#extend">Extend</a></li>
  <li><a href="#cli">CLI</a></li>
  <li><a href="#philosophy">Philosophy</a></li>
  <li><a href="#benchmarks">Benchmarks</a></li>
  <li><a href="#contributing">Contributing</a></li>
  <li><a href="#license">License</a></li>
</ul>

<h2 id="philosophy">Philosophy behind marked</h2>

The point of marked was to create a markdown compiler where it was possible to
frequently parse huge chunks of markdown without having to worry about
caching the compiled output somehow...or blocking for an unnecessarily long time.

marked is very concise and still implements all markdown features. It is also
now fully compatible with the client-side.

marked more or less passes the official markdown test suite in its
entirety. This is important because a surprising number of markdown compilers
cannot pass more than a few tests. It was very difficult to get marked as
compliant as it is. It could have cut corners in several areas for the sake
of performance, but did not in order to be exactly what you expect in terms
of a markdown rendering. In fact, this is why marked could be considered at a
disadvantage in the benchmarks.

Along with implementing every markdown feature, marked also implements [GFM
features][gfmf].

<h2 id="installation">Install</h2>

``` bash
npm install marked --save
```

or if you want to use the `marked` CLI tool (not necessary when using npm run-scripts):

``` bash
npm install -g marked
```

<h2 id="usage">Usage</h2>

Minimal usage:

```js
var marked = require('marked');
console.log(marked('I am using __markdown__.'));
// Outputs: <p>I am using <strong>markdown</strong>.</p>
```

Example setting options:

```js
var marked = require('marked');
marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: false,
  xhtml: false
});

console.log(marked('I am using __markdown__.'));
```

### Browser

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Marked in the browser</title>
  <script src="lib/marked.js"></script>
</head>
<body>
  <div id="content"></div>
  <script>
    document.getElementById('content').innerHTML =
      marked('# Marked in browser\n\nRendered by **marked**.');
  </script>
</body>
</html>
```

<h2 id="marked-call">marked(markdownString [,options] [,callback])</h2>

### markdownString

Type: `string`

String of markdown source to be compiled.

### options

Type: `object`

Hash of options. Can also be set using the `marked.setOptions` method as seen
above.

### callback

Type: `function`

Function called when the `markdownString` has been fully parsed when using
async highlighting. If the `options` argument is omitted, this can be used as
the second argument.

<h2 id="options">Options</h2>

### highlight

Type: `function`

A function to highlight code blocks. The first example below uses async highlighting with
[node-pygmentize-bundled][pygmentize], and the second is a synchronous example using
[highlight.js][highlight]:

```js
var marked = require('marked');

var markdownString = '```js\n console.log("hello"); \n```';

// Async highlighting with pygmentize-bundled
marked.setOptions({
  highlight: function (code, lang, callback) {
    require('pygmentize-bundled')({ lang: lang, format: 'html' }, code, function (err, result) {
      callback(err, result.toString());
    });
  }
});

// Using async version of marked
marked(markdownString, function (err, content) {
  if (err) throw err;
  console.log(content);
});

// Synchronous highlighting with highlight.js
marked.setOptions({
  highlight: function (code) {
    return require('highlight.js').highlightAuto(code).value;
  }
});

console.log(marked(markdownString));
```

#### highlight arguments

`code`

Type: `string`

The section of code to pass to the highlighter.

`lang`

Type: `string`

The programming language specified in the code block.

`callback`

Type: `function`

The callback function to call when using an async highlighter.

### renderer

Type: `object`
Default: `new Renderer()`

An object containing functions to render tokens to HTML.

#### Overriding renderer methods

The renderer option allows you to render tokens in a custom manner. Here is an
example of overriding the default heading token rendering by adding an embedded anchor tag like on GitHub:

```javascript
var marked = require('marked');
var renderer = new marked.Renderer();

renderer.heading = function (text, level) {
  var escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');

  return '<h' + level + '><a name="' +
                escapedText +
                 '" class="anchor" href="#' +
                 escapedText +
                 '"><span class="header-link"></span></a>' +
                  text + '</h' + level + '>';
};

console.log(marked('# heading+', { renderer: renderer }));
```
This code will output the following HTML:
```html
<h1>
  <a name="heading-" class="anchor" href="#heading-">
    <span class="header-link"></span>
  </a>
  heading+
</h1>
```

#### Block level renderer methods

- code(*string* code, *string* language)
- blockquote(*string* quote)
- html(*string* html)
- heading(*string* text, *number*  level)
- hr()
- list(*string* body, *boolean* ordered)
- listitem(*string*  text)
- paragraph(*string* text)
- table(*string* header, *string* body)
- tablerow(*string* content)
- tablecell(*string* content, *object* flags)

`flags` has the following properties:

```js
{
    header: true || false,
    align: 'center' || 'left' || 'right'
}
```

#### Inline level renderer methods

- strong(*string* text)
- em(*string* text)
- codespan(*string* code)
- br()
- del(*string* text)
- link(*string* href, *string* title, *string* text)
- image(*string* href, *string* title, *string* text)
- text(*string* text)

### gfm

Type: `boolean`
Default: `true`

Enable [GitHub flavored markdown][gfm].

### tables

Type: `boolean`
Default: `true`

Enable GFM [tables][tables].
This option requires the `gfm` option to be true.

### breaks

Type: `boolean`
Default: `false`

Enable GFM [line breaks][breaks].
This option requires the `gfm` option to be true.

### pedantic

Type: `boolean`
Default: `false`

Conform to obscure parts of `markdown.pl` as much as possible. Don't fix any of
the original markdown bugs or poor behavior.

### sanitize

Type: `boolean`
Default: `false`

Sanitize the output. Ignore any HTML that has been input.

### smartLists

Type: `boolean`
Default: `true`

Use smarter list behavior than the original markdown. May eventually be
default with the old behavior moved into `pedantic`.

### smartypants

Type: `boolean`
Default: `false`

Use "smart" typographic punctuation for things like quotes and dashes.

### xhtml

Type: `boolean`
Default: `false`

Self-close the tags for void elements (&lt;br/&gt;, &lt;img/&gt;, etc.) with a "/" as required by XHTML.

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

<h2 id="cli">CLI</h2>

``` bash
$ marked -o hello.html
hello world
^D
$ cat hello.html
<p>hello world</p>
```

<h2 id="benchmarks">Benchmarks</h2>

node v8.9.4

``` bash
$ npm run bench
marked completed in 3408ms.
marked (gfm) completed in 3465ms.
marked (pedantic) completed in 3032ms.
showdown (reuse converter) completed in 21444ms.
showdown (new converter) completed in 23058ms.
markdown-it completed in 3364ms.
markdown.js completed in 12090ms.
```

### Pro level

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

<h2 id="contributing">Contributing</h2>

1. If the code in a pull request can have a test written for it, it should have it. (If the test already exists, please reference the test which should pass.)
2. Do not merge your own. Mainly for collaborators and owners, please do not review and merge your own PRs.

### Tests

The marked test suite is set up slightly strangely: `test/new` is for all tests
that are not part of the original markdown.pl test suite (this is where your
test should go if you make one). `test/original` is only for the original
markdown.pl tests.

In other words, if you have a test to add, add it to `test/new/`. If your test
uses a certain feature, for example, maybe it assumes GFM is *not* enabled, you
can add [front-matter](https://www.npmjs.com/package/front-matter) to the top of
your `.md` file

``` yml
---
gfm: false
---
```

To run the tests:

``` bash
npm run test
```

### Contribution License Agreement

If you contribute code to this project, you are implicitly allowing your code
to be distributed under the MIT license. You are also implicitly verifying that
all code is your original work. `</legalese>`

<h2 id="releasing">Releasing</h2>

**Master is always shippable:** We try to merge PRs in such a way that `master` is the only branch to really be concerned about *and* `master` can always be released. This allows smoother flow between new fetures, bug fixes, and so on. (Almost a continuous deployment setup, without automation.)

**Version naming:** relatively standard [major].[minor].[patch] where `major` releases represent known breaking changes to the previous release, `minor` represent additions of new funcitonality without breaking changes, and `patch` releases represent changes meant to fix previously released functionality with no new functionality. Note: When the major is a zero, it means the library is still in a beta state wherein the `major` does not get updated; therefore, `minor` releases may introduce breaking changes, and `patch` releases may contain new features.

**Release process:**

1. Check out library
2. Make sure you are on the `master` branch
3. Create release branch from `master`
4. `$ npm run build` (builds minified version and whatnot)
5. `$ npm version [major|minor|patch]` (updates `package.json`)
6. `$ npm publish` (publishes package to NPM)
7. Submit PR
8. Merge PR (only time where submitter should be "allowed" to merge his or her own)
9. Navigate to the "Releases" tab on the project main page -> "Draft new release"
10. Add version number matching the one in the `package.json` file after publishing the release
11. Make sure `master` is the branch from which the release will be made
12. Add notes regarding what users should expect from the release
13. Click "Publish release"

<h2 id="license">License</h2>

Copyright (c) 2011-2018, Christopher Jeffrey. (MIT License)

See [LICENSE](https://github.com/markedjs/marked/blob/master/LICENSE) for more details.

[gfm]: https://help.github.com/articles/github-flavored-markdown
[gfmf]: http://github.github.com/github-flavored-markdown/
[pygmentize]: https://github.com/rvagg/node-pygmentize-bundled
[highlight]: https://github.com/isagalaev/highlight.js
[badge]: http://badge.fury.io/js/marked
[tables]: https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet#wiki-tables
[breaks]: https://help.github.com/articles/github-flavored-markdown#newlines
