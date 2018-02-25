# marked

[![NPM version](https://badge.fury.io/js/marked.svg)][badge] [![NPM dependencies](https://david-dm.org/markedjs/marked.svg)][badge]

Marked is 

1. built for speed.<sup>*</sup>
2. a low-level markdown compiler that allows frequent parsing of large chunks of markdown without caching or blocking for long periods of time.<sup>**</sup>
3. light-weight while implementing all markdown features from the supported flavors & specifications.<sup>***</sup>
4. available as a command line interface (CLI) and running in client- or server-side JavaScript projects.

- <small><sup>*</sup> Still working on metrics for comparative analysis and definition.</small>
- <small><sup>**</sup> As few dependencies as possible.</small>
- <small><sup>***</sup> Strict compliance could result in slower processing when running comparative benchmarking.</small>

<ul>
  <li><a href="#install">Installation</a></li>
  <li><a href="#usage">Usage</a></li>
  <li><a href="#marked"><code>marked()</code></a></li>
  <li><a href="#options">Options</a></li>
  <li><a href="#extend">Extend</a></li>
  <li><a href="#cli">CLI</a></li>
  <li><a href="#philosophy">Philosophy</a></li>
  <li><a href="#benchmarks">Benchmarks</a></li>
  <li><a href="#contributing">Contributing</a></li>
  <li><a href="#license">License</a></li>
</ul>

<h2 id="installation">Installation</h2>

**CLI:** `npm install -g marked`

**In-browser:** `npm install marked --save`

<h2 id="usage">Usage</h2>

**CLI**

``` bash
$ marked -o hello.html
hello world
^D
$ cat hello.html
<p>hello world</p>
```

**Browser**

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Marked in the browser</title>
  <script src="/path/to/marked.min.js"></script>
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


Marked offers [advanced configurations](https://github.com/markedjs/marked/blob/master/USAGE_ADVANCED.md) and extensibility as well.

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
