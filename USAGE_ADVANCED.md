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
var myMarked = require('marked');

// Set options
// `highlight` example uses `highlight.js`
myMarked.setOptions({
  renderer: new marked.Renderer(),
  highlight: function(code) {
  	return require('highlight.js').highlightAuto(code).value;
  },
  pedantic: false,
  gfm: true,
  tables: true,
  breaks: false,
  sanitize: false,
  smartLists: true,
  smartypants: false,
  xhtml: false
});

// Compile
console.log(myMarked('I am using __markdown__.'));
```

<h2 id="options">Options</h2>

|Member     |Type      |Notes                                                                                                                        |
|:----------|:---------|:----------------------------------------------------------------------------------------------------------------------------|
|highlight  |`function`|A function to highlight code blocks. See also: <a href="#highlight">Asynchronous highlighting</a>.                           |
|renderer   |`object`  |An object containing functions to render tokens to HTML. Default: `new Renderer()`                                           |
|pedantic   |`boolean` |Conform to obscure parts of `markdown.pl` as much as possible. Don't fix original markdown bugs or behavior. Default: `false`|
|gfm        |`boolean` |Use approved [GitHub Flavored Markdown (GFM) specification](https://github.github.com/gfm/).                                 |
|tables     |`boolean` |Use [GFM Tables extension](https://github.github.com/gfm/#tables-extension-). Requires `gfm` be `true`.                      |
|breaks     |`boolean` |Use GFM [hard](https://github.github.com/gfm/#hard-line-breaks) and [soft](https://github.github.com/gfm/#soft-line-breaks) line breaks. Requires `gfm` be `true`. Default: `false`|
|sanitize   |`boolean` |Ignore HTML passed into `markdownString` (sanitize the input). Default: `false`                                              |
|smartlists |`boolean` |Use smarter list behavior than those found in `markdown.pl`. Default: `true`                                                 |
|smartypants|`boolean` |Use "smart" typographic punctuation for things like quotes and dashes.                                                       |
|xhtml      |`boolean` |Self-close the tags for void elements (&lt;br/&gt;, &lt;img/&gt;, etc.) with a "/" as required by XHTML. Default: `false`    |

<h2 id="highlight">Asynchronous highlighting</h2>

Unlike `highlight.js` the `pygmatize.js` library uses asynchronous highlighting. This example demonstrates that marked is agnostic when it comes to the highlighter you use.

```js
myMarked.setOption({
  highlight: function(code, lang, callback) {
    require('pygmentize-bundled')({ lang: lang, format: 'html' }, code, function (err, result) {
      callback(err, result.toString());
    });
  }
});

console.log(myMarked(markdownString));
```

In both examples, `code` is a `string` representing the section of code to pass to the highlighter. In this example, `lang` is a `string` informing the highlighter what programming lnaguage to use for the `code` and `callback` is the `function` the asynchronous highlighter will call once complete.

### renderer

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

