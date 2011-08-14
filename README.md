# marked

A full-featured markdown parser and compiler implemented in ~430 lines of JS.  
Built for speed.

## Benchmarks

``` bash
$ node test/bench
marked: 6260ms
showdown: 21665ms
markdownjs: 69168ms
```

The point of marked was to create a markdown compiler where it was possible to 
frequently parse huge chunks of markdown without having to worry about 
caching the compiled output somehow...or blocking for an unnecesarily long time.

marked lingers around 430 (may vary) lines long and still implements all 
markdown features. It is also now fully compatible with the client-side.

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

This parser was written in one night, so there's still a lot on the todo list.
There may also be some bugs.

- Implement GFM features.
- Optimize the parser so it accepts a stream of tokens from the lexer. This
  should enhance performance even further, although, no lookaheads would 
  be possible.
- Possibly add some 
  [ReMarkable](http://camendesign.com/code/remarkable/documentation.html) 
  features while remaining backwardly compatible with all markdown syntax.
- Find a better way of testing. Create a test suite from scratch because most 
  markdown compilers don't appear to be working properly in every aspect (but 
  it's hard to tell because the markdown "spec" is so vague).
- Possibly alter rules to recognize arbitrary blocks of HTML better.
- Recognize and parse paragraph list items better.
- Add an explicit pretty printing and minification feature.

I've still just begun to write this. I expect I will be updating it frequently.
