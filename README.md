## Marked wants you!

In case you haven't noticed, and judging by attendance you haven't&hellip; (Movie. Major League. No? Anyway.)

In case you haven't noticed, after years of [being mostly dead](https://github.com/markedjs/marked/issues/1106) (not to be confused with stable), Marked is trying to come back to life. We're about at the "You just wiggled your finger" stage ([The Princess Bride](https://youtu.be/yokQ0_8__ts). No? Come on!)

There are four of us on the core team and we have one curious contributor helping us make moves (see [AUTHORS](https://github.com/markedjs/marked/blob/master/AUTHORS.md) page).

We've stirred the tanks a bit and, Houston, we have a problem. ([Apollo 13](https://youtu.be/Bti9_deF5gs). No? Where have y'all been!? Seriously, we haven't talked in a while, where have you been? Oh, right, better question, where has the *marked* community been? Again, mostly dead&hellip;)

After careful analysis and consideration we have determined the marked test suite to be&hellip;ummmmm&hellip;incomplete. We run about 63 tests during our continuous integration cycle. We say we support the [CommonMark specification](http://spec.commonmark.org/0.28/). The CommonMark specification has roughly 625 testable scenarios. We're prioritizing spec compliance before going to a 1.0 release.

So, yeah, that's a thing.

It will take the four or five of us god only knows how long to write the tests, before even considering what to do to fix them. 

That's where you come in.

We're introducing **the Marked Defibrillator Challenge**.

### Defib. Details

Not too long ago we introduced our [AUTHORS](https://github.com/markedjs/marked/blob/master/AUTHORS.md) page. We also brought in badges to help identify who does or has done what.

We're introducing a new, limited badge: Defibrilator.

One of these will be given to anyone who submits a PR testing a single example not already covered by other PRs or our test suite. It's pretty simple (maybe), just follow [this example](https://github.com/markedjs/marked/pull/1104).

1. Follow our [CONTRIBUTING](https://github.com/markedjs/marked/blob/master/CONTRIBUTING.md) guidelines.
2. The test files must following the naming convention of cm_example_## (where `cm` indicates that it is the CommonMark Specification, `example` just means example, and the `##` should be replaced of the example number from the specification).
3. Must include a both the Markdown and the HTML from the exammple.
4. If the PR passes our continuous integration build, then we (and you) know that Marked can do the thing, and we can merge it in almost immediately; otherwise,
5. if the PR fails our continuous integration build, then we (and you) know that Marked cannot do the thing, and you can either let it sit (you'll still get the badge); or, if you can fix it, great! update the PR and we'll review the solution before merging.

Note: The failing PRs will take us longer to merge; so, it may take longer to get the badge and have your GitHub handle listed on the [AUTHORS](https://github.com/markedjs/marked/blob/master/AUTHORS.md) page; but those failing ones are bit more valuable to us in order to improve marked for our users.

## Read me

<ul>
  <li><a href="#marked">About</a></li>
  <li><a href="#install">Installation</a></li>
  <li><a href="#usage">Usage</a></li>
  <li><a href="#specifications">Supported Markdown specifications</a></li>
  <li><a href="#security">Security</a></li>
  <li><a href="#contributing">Contributing</a></li>
  <li><a href="#authors">Authors</a></li>
  <li><a href="#license">License</a></li>
</ul>

<h2 id="marked">Marked</h2>

Marked is 

1. built for speed.<sup>*</sup>
2. a low-level markdown compiler that allows frequent parsing of large chunks of markdown without caching or blocking for long periods of time.<sup>**</sup>
3. light-weight while implementing all markdown features from the supported flavors & specifications.<sup>***</sup>
4. available as a command line interface (CLI) and running in client- or server-side JavaScript projects.

<p><small><sup>*</sup> Still working on metrics for comparative analysis and definition.</small><br>
<small><sup>**</sup> As few dependencies as possible.</small><br>
<small><sup>***</sup> Strict compliance could result in slower processing when running comparative benchmarking.</small></p>

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


Marked offers [advanced configurations](https://github.com/markedjs/marked/blob/master/USAGE_ADVANCED.md) and [extensibility](https://github.com/markedjs/marked/blob/master/USAGE_EXTENSIBILITY.md) as well.

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

Therefore, please disclose potential security issues by email to the project [committers](https://github.com/markedjs/marked/blob/master/AUTHORS.md) as well as the [listed owners within NPM](https://docs.npmjs.com/cli/owner). We will provide an initial assessment of security reports within 48 hours and should apply patches within 2 weeks (also, feel free to contribute a fix for the issue).

<h2 id="contributing">Contributing</h2>

The marked community enjoys a spirit of collaboration and contribution from all comers. Whether you're just getting started with Markdown, JavaScript, and Marked or you're a veteran with it all figured out, we're here to help each other improve as professionals while helping Marked improve technically. Please see our [contributing documentation](https://github.com/markedjs/marked/blob/master/CONTRIBUTING.md) for more details.

For our Contribution License Agreement, see our [license](https://github.com/markedjs/marked/blob/master/LICENSE.md).

<h2 id="authors">Authors</h2>

For list of credited authors and contributors, please see our [authors page](https://github.com/markedjs/marked/blob/master/AUTHORS.md).

<h2 id="license">License</h2>

Copyright (c) 2011-2018, Christopher Jeffrey. (MIT License)

See [license](https://github.com/markedjs/marked/blob/master/LICENSE.md) for more details.

