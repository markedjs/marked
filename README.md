# Marked

Marked is 

1. built for speed.
2. a low-level markdown compiler that allows frequent parsing of large chunks of markdown without caching or blocking for long periods of time.
3. light-weight while implementing all markdown features from the supported flavors & specifications.
4. available as a command line interface (CLI) and running in client- or server-side JavaScript projects.

## Installation

**CLI:** `npm install -g marked`

**In-browser:** `npm install marked --save`

## Usage 

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
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>
<body>
  <div id="content"></div>
  <script>
    document.getElementById('content').innerHTML =
      marked('# Marked in the browser\n\nRendered by **marked**.');
  </script>
</body>
</html>
```



## License

Copyright (c) 2011-2018, Christopher Jeffrey. (MIT License)

