# marked

A full-featured markdown parser and compiler implemented in ~430 lines of JS.  
Built for speed.

## Benchmarks

``` bash
$ node test --bench
marked completed in 15051ms.
showdown completed in 28267ms. 
markdown-js completed in 70732ms.
```

## Install

``` bash
$ npm install marked
```

# Another javascript markdown parser

The point of marked was to create a markdown compiler where it was possible to 
frequently parse huge chunks of markdown without having to worry about 
caching the compiled output somehow...or blocking for an unnecesarily long time.

marked lingers around 430 (may vary) lines long and still implements all 
markdown features. It is also now fully compatible with the client-side.

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

## Todo (& notes to self)

- Implement GFM features.
- Possibly add some 
  [ReMarkable](http://camendesign.com/code/remarkable/documentation.html) 
  features while remaining backwardly compatible with all markdown syntax.
- Optimize the lexer to return an iterator instead of a collection of tokens.
- Add an explicit pretty printing and minification feature.
