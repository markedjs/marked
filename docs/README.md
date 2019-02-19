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

**In-browser:** `npm install marked`

<h2 id="usage">Usage</h2>

### Warning: 🚨 Marked does not [sanitize](https://marked.js.org/#/USING_ADVANCED.md#options) the output HTML by default 🚨

**CLI**

``` bash
$ marked -o hello.html
hello world
^D
$ cat hello.html
<p>hello world</p>
```

``` bash
$ marked -s "*hello world*"
<p><em>hello world</em></p>
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
      marked('# Marked in browser\n\nRendered by **marked**.');
  </script>
</body>
</html>
```


Marked offers [advanced configurations](#/USING_ADVANCED.md) and [extensibility](#/USING_PRO.md) as well.

<h2 id="specifications">Supported Markdown specifications</h2>

We actively support the features of the following [Markdown flavors](https://github.com/commonmark/CommonMark/wiki/Markdown-Flavors).

|Flavor                                                     |Version    |
|:----------------------------------------------------------|:----------|
|The original markdown.pl                                   |--         |
|[CommonMark](http://spec.commonmark.org/0.28/)             |0.28       |
|[GitHub Flavored Markdown](https://github.github.com/gfm/) |0.28       |

By supporting the above Markdown flavors, it's possible that Marked can help you use other flavors as well; however, these are not actively supported by the community.

<h2 id="security">Security</h2>

The only completely secure system is the one that doesn't exist in the first place. Having said that, we take the security of Marked very seriously.

Therefore, please disclose potential security issues by email to the project [committers](#/AUTHORS.md) as well as the [listed owners within NPM](https://docs.npmjs.com/cli/owner). We will provide an initial assessment of security reports within 48 hours and should apply patches within 2 weeks (also, feel free to contribute a fix for the issue).

