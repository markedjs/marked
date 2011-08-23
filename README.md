# marked

A full-featured markdown parser and compiler implemented in ~430 lines of JS.  
Built for speed.

## Benchmarks

``` bash
$ node test --old_bench
marked: 6260ms
showdown: 21665ms
markdownjs: 69168ms
```

(Above is the old benchmark, try `node test --bench` for the new ones.)

The point of marked was to create a markdown compiler where it was possible to 
frequently parse huge chunks of markdown without having to worry about 
caching the compiled output somehow...or blocking for an unnecesarily long time.

marked lingers around 430 (may vary) lines long and still implements all 
markdown features. It is also now fully compatible with the client-side.

marked more or less passes the official markdown test suite in its 
entirety. This is important because a surprising number of markdown compilers 
cannot pass more than a few tests.

## Install

``` bash
$ npm install marked
```

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

## Todo (& notes to self)

- Implement GFM features.
- Possibly add some 
  [ReMarkable](http://camendesign.com/code/remarkable/documentation.html) 
  features while remaining backwardly compatible with all markdown syntax.
- Optimize the parser so it accepts a stream of tokens from the lexer. This
  should enhance performance even further, although, no lookaheads would 
  be possible.
- Add an explicit pretty printing and minification feature.
