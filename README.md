# marked

A full-featured markdown parser and compiler.
Built for speed.

## Benchmarks

node v0.4.x

``` bash
$ node test --bench
marked completed in 12071ms.
showdown (reuse converter) completed in 27387ms.
showdown (new converter) completed in 75617ms.
markdown-js completed in 70069ms.
```

__UPDATE:__ Apparently Google optimized v8 very well somewhere between when
node v0.4.10 and node v0.6.0 were released. Unfortunately they didn't
seem to optimize my code. marked is still faster than everything (except
Discount and C modules most likely), however, it's not supremely better,
like it used to be. For example, its only roughly twice as fast as
markdown-js now.

node v0.6.x

``` bash
$ node test --bench
marked completed in 11998ms.
showdown (reuse converter) completed in 15686ms.
showdown (new converter) completed in 18014ms.
markdown-js completed in 23520ms.
```

Benchmarks for other engines to come (?).

## Install

``` bash
$ npm install marked
```

## Another javascript markdown parser

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

## Usage

``` js
var marked = require('marked');
console.log(marked('i am using __markdown__.'));
```

You also have direct access to the lexer and parser if you so desire.

``` js
var tokens = marked.lexer(str);
console.log(marked.parser(tokens));
```

``` bash
$ node
> require('marked').lexer('> i am using marked.')
[ { type: 'blockquote_start' },
  { type: 'text', text: ' i am using marked.' },
  { type: 'blockquote_end' },
  links: {} ]
```

## CLI

``` bash
$ marked -o hello.html
hello world
^D
$ cat hello.html
<p>hello world</p>
```

## Todo

- Implement GFM features.
- Add an explicit pretty printing and minification feature.
