Marked is

1. built for speed.<sup>*</sup>
2. a low-level markdown compiler for parsing markdown without caching or blocking for long periods of time.<sup>**</sup>
3. light-weight while implementing all markdown features from the supported flavors & specifications.<sup>***</sup>
4. available as a command line interface (CLI) and running in client- or server-side JavaScript projects.

<p><small><sup>*</sup> Still working on metrics for comparative analysis and definition.</small><br>
<small><sup>**</sup> As few dependencies as possible.</small><br>
<small><sup>***</sup> Strict compliance could result in slower processing when running comparative benchmarking.</small></p>


<h2 id="demo">Demo</h2>

Checkout the [demo page](./demo/) to see marked in action ⛹️

These documentation pages are also rendered using marked 💯


<h2 id="installation">Installation</h2>

**CLI:** `npm install -g marked`

**In-browser:**
```
npm install marked
```
<h2 id="usage">Usage</h2>

### Warning: 🚨 Marked does not [sanitize](/using_advanced#options) the output HTML. If you are processing potentially unsafe strings, it's important to filter for possible XSS attacks. Some filtering options include [DOMPurify](https://github.com/cure53/DOMPurify) (recommended), [js-xss](https://github.com/leizongmin/js-xss), [sanitize-html](https://github.com/apostrophecms/sanitize-html) and [insane](https://github.com/bevacqua/insane) on the *output* HTML! 🚨

```
DOMPurify.sanitize(marked.parse(`<img src="x" onerror="alert('not happening')">`));
```

**⚠️ Input: special ZERO WIDTH unicode characters (for example `\uFEFF`) might interfere with parsing. Some text editors add them at the start of the file (see: [#2139](https://github.com/markedjs/marked/issues/2139)).**

```js
// remove the most common zerowidth characters from the start of the file
marked.parse(
  contents.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/,"")
)
```

**CLI**

``` bash
# Example with stdin input
$ marked -o hello.html
hello world
^D
$ cat hello.html
<p>hello world</p>
```

``` bash
# Example with string input
$ marked -s "*hello world*"
<p><em>hello world</em></p>
```

```bash
# Example with file input

echo "**bold text example**" > readme.md

$ marked -i readme.md -o readme.html
$ cat readme.html
<p><strong>bold text example</strong></p>
```

```bash
# Print all options
$ marked --help
```

*CLI Config*

A config file can be used to configure the marked cli.

If it is a `.json` file it should be a JSON object that will be passed to marked as options.

If `.js` is used it should have a default export of a marked options object or a function that takes `marked` as a parameter.
It can use the `marked` parameter to install extensions using `marked.use`.

By default the marked cli will look for a config file in your home directory in the following order.

- `~/.marked.json`
- `~/.marked.js`
- `~/.marked/index.js`

```bash
# Example with custom config

echo '{ "breaks": true }' > config.json

$ marked -s 'line1\nline2' -c config.json
<p>line1<br>line2</p>
```

**Browser**

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Marked in the browser</title>
</head>
<body>
  <div id="content"></div>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script>
    document.getElementById('content').innerHTML =
      marked.parse('# Marked in browser\n\nRendered by **marked**.');
  </script>
</body>
</html>
```
or import esm module

```html
<script type="module">
  import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";
  document.getElementById('content').innerHTML =
    marked.parse('# Marked in the browser\n\nRendered by **marked**.');
</script>
```

**Node.js**

```js
import { marked } from 'marked';
// or const { marked } = require('marked');

const html = marked.parse('# Marked in Node.js\n\nRendered by **marked**.');
```


Marked offers [advanced configurations](/using_advanced) and [extensibility](/using_pro) as well.

<h2 id="specifications">Supported Markdown specifications</h2>

We actively support the features of the following [Markdown flavors](https://github.com/commonmark/CommonMark/wiki/Markdown-Flavors).

| Flavor                                                     | Version | Status                                                             |
| :--------------------------------------------------------- | :------ | :----------------------------------------------------------------- |
| The original markdown.pl                                   | --      |                                                                    |
| [CommonMark](http://spec.commonmark.org/0.30/)             | 0.30    | [Work in progress](https://github.com/markedjs/marked/issues/1202) |
| [GitHub Flavored Markdown](https://github.github.com/gfm/) | 0.29    | [Work in progress](https://github.com/markedjs/marked/issues/1202) |

By supporting the above Markdown flavors, it's possible that Marked can help you use other flavors as well; however, these are not actively supported by the community.

<h2 id="tools">List of Tools Using Marked</h2>

We actively support the usability of Marked in super-fast markdown transformation, some of Tools using `Marked` for single-page creations are

| Tools                                                               |                  Description                                               |
| :-----------------------------------------------------------------  | :------------------------------------------------------------------------  |
| [zero-md](https://zerodevx.github.io/zero-md/)                      | A native markdown-to-html web component to load and display an external MD file.It uses Marked for super-fast markdown transformation. |
| [texme](https://github.com/susam/texme)                             | TeXMe is a lightweight JavaScript utility to create self-rendering Markdown + LaTeX documents.             |
| [StrapDown.js](https://naereen.github.io/StrapDown.js/)             | StrapDown.js is an awesome on-the-fly Markdown to HTML text processor.                |
| [raito](https://raito.arnaud.at/)             | Mini Markdown Wiki/CMS in 8kb of JavaScript.                |
| [Homebrewery](https://homebrewery.naturalcrit.com/)             | The Homebrewery is a tool for making authentic looking D&D content using Markdown. It is distributed under the terms of the MIT.             |

<h2 id="security">Security</h2>

The only completely secure system is the one that doesn't exist in the first place. Having said that, we take the security of Marked very seriously.

Therefore, please disclose potential security issues by email to the project [committers](/authors) as well as the [listed owners within NPM](https://docs.npmjs.com/cli/owner). We will provide an initial assessment of security reports within 48 hours and should apply patches within 2 weeks (also, feel free to contribute a fix for the issue).
