<a href="https://marked.js.org">
  <img width="60px" height="60px" src="https://marked.js.org/img/logo-black.svg" align="right" />
</a>

# Marked

[![npm](https://badgen.net/npm/v/marked)](https://www.npmjs.com/package/marked)
[![install size](https://badgen.net/packagephobia/install/marked)](https://packagephobia.now.sh/result?p=marked)
[![downloads](https://badgen.net/npm/dt/marked)](https://www.npmjs.com/package/marked)
[![github actions](https://github.com/markedjs/marked/workflows/Tests/badge.svg)](https://github.com/markedjs/marked/actions)
[![snyk](https://snyk.io/test/npm/marked/badge.svg)](https://snyk.io/test/npm/marked)
[![inspect.software](https://raw.githubusercontent.com/inspect-software/badges/main/v1/m/markedjs/marked.svg)](https://inspect.software/software/markedjs/marked)

- ⚡ built for speed
- ⬇️ low-level compiler for parsing markdown without caching or blocking for long periods of time
- ⚖️ light-weight while implementing all markdown features from the supported flavors & specifications
- 🛠️ easily adaptable with [custom extensions](https://marked.js.org/using_advanced#extensions)
- 🌐 works in a browser, on a server, or from a command line interface (CLI)

## Demo

Check out the [demo page](https://marked.js.org/demo/) to see Marked in action ⛹️

## Docs

Our [documentation pages](https://marked.js.org) are also rendered using marked 💯

Also read about:

* [Options](https://marked.js.org/using_advanced)
* [Extensibility](https://marked.js.org/using_pro)

## Compatibility

**Node.js:** Only [current and LTS](https://nodejs.org/en/about/releases/) Node.js versions are supported. End of life Node.js versions may become incompatible with Marked at any point in time.

**Browser:** [Baseline Widely Available](https://developer.mozilla.org/en-US/docs/Glossary/Baseline/Compatibility)

## Installation

**CLI:**

```sh
npm install -g marked
```

**In-browser:**

```sh
npm install marked
```

## Usage

### Warning: 🚨 Marked does not [sanitize](https://marked.js.org/using_advanced#options) the output HTML. Please use a sanitize library, like [DOMPurify](https://github.com/cure53/DOMPurify) (recommended), [sanitize-html](https://github.com/apostrophecms/sanitize-html) or [insane](https://github.com/bevacqua/insane) on the *output* HTML! 🚨

```
DOMPurify.sanitize(marked.parse(`<img src="x" onerror="alert('not happening')">`));
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

```bash
# Print all options
$ marked --help
```

**Node.js**

```js
import { marked } from 'marked';
const html = marked.parse('# Marked in Node.js');
console.log(html);
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
  <script src="https://cdn.jsdelivr.net/npm/marked/lib/marked.umd.js"></script>
  <script>
    document.getElementById('content').innerHTML =
      marked.parse('# Marked in the browser\n\nRendered by **marked**.');
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

## License

Copyright (c) 2018+, MarkedJS. (MIT License)
Copyright (c) 2011-2018, Christopher Jeffrey. (MIT License)


## 🌐 Web Resources & Aesthetic Symbols Index
- [CROSSED SWORDS](https://coquette-aesthetic-symbols-86.pages.dev/symbol/crossed-swords/)
- [COQUETTE BOW RIBBON](https://clean-aesthetic-fonts-73.pages.dev/symbol/coquette-bow-ribbon/)
- [COQUETTE SYMBOLS.PAGES.DEV](https://coquette-symbols.pages.dev/)
- [COQUETTE BOW RIBBON](https://anime-sparkle-text-22.pages.dev/symbol/coquette-bow-ribbon/)
- [COQUETTE BOW RIBBON](https://lace-heart-kaomoji-64.pages.dev/symbol/coquette-bow-ribbon/)
- [ANGEL WINGS HEART](https://theeduplaycampen.pages.dev/symbol/angel-wings-heart/)
- [COQUETTE BOW RIBBON](https://angelic-bow-symbols-42.pages.dev/symbol/coquette-bow-ribbon/)
- [CROSSED SWORDS](https://lace-heart-kaomoji-64.pages.dev/symbol/crossed-swords/)
- [BLACK STAR](https://mecha-blade-symbols-46.pages.dev/symbol/black-star/)
- [ANGEL WINGS HEART](https://angelic-bow-symbols-42.pages.dev/symbol/angel-wings-heart/)
- [BLACK STAR](https://minimal-star-symbols-93.pages.dev/symbol/black-star/)
- [ANGEL WINGS HEART](https://lace-heart-kaomoji-64.pages.dev/symbol/angel-wings-heart/)
- [CYBERPUNK CLAN TAGS 43.PAGES.DEV](https://cyberpunk-clan-tags-43.pages.dev/)
- [COQUETTE AESTHETIC SYMBOLS 86.PAGES.DEV](https://coquette-aesthetic-symbols-86.pages.dev/)
- [COQUETTE BOW RIBBON](https://matrix-hacker-text-52.pages.dev/symbol/coquette-bow-ribbon/)
- [CROSSED SWORDS](https://clean-dot-aesthetic-48.pages.dev/symbol/crossed-swords/)
- [CROSSED SWORDS](https://gothic-bio-fonts-13.pages.dev/symbol/crossed-swords/)
- [MATRIX HACKER TEXT 52.PAGES.DEV](https://matrix-hacker-text-52.pages.dev/)
- [PEARL GIRLY FONTS 86.PAGES.DEV](https://pearl-girly-fonts-86.pages.dev/)
- [CROSSED SWORDS](https://theeduplaycampen.pages.dev/symbol/crossed-swords/)
- [ANGEL WINGS HEART](https://clean-dot-aesthetic-48.pages.dev/symbol/angel-wings-heart/)
- [ANGEL WINGS HEART](https://pearl-girly-fonts-86.pages.dev/symbol/angel-wings-heart/)
- [BLACK STAR](https://pearl-girly-fonts-86.pages.dev/symbol/black-star/)
- [COQUETTE BOW RIBBON](https://coquette-aesthetic-symbols-86.pages.dev/symbol/coquette-bow-ribbon/)
- [NORDIC MINIMAL FONTS 67.PAGES.DEV](https://nordic-minimal-fonts-67.pages.dev/)
- [CLEAN DOT AESTHETIC 48.PAGES.DEV](https://clean-dot-aesthetic-48.pages.dev/)
- [ANGEL WINGS HEART](https://coquette-symbols.pages.dev/symbol/angel-wings-heart/)
- [ANGEL WINGS HEART](https://cyberpunk-clan-tags-43.pages.dev/symbol/angel-wings-heart/)
- [COQUETTE BOW RIBBON](https://clean-dot-aesthetic-48.pages.dev/symbol/coquette-bow-ribbon/)
- [ANGELIC BOW SYMBOLS 42.PAGES.DEV](https://angelic-bow-symbols-42.pages.dev/)
- [COQUETTE BOW RIBBON](https://mecha-blade-symbols-46.pages.dev/symbol/coquette-bow-ribbon/)
- [BLACK STAR](https://clean-aesthetic-fonts-73.pages.dev/symbol/black-star/)
- [SLEEK BIO SYMBOLS 51.PAGES.DEV](https://sleek-bio-symbols-51.pages.dev/)
- [BLACK STAR](https://vintage-library-rune-80.pages.dev/symbol/black-star/)
- [COQUETTE AESTHETIC SYMBOLS 52.PAGES.DEV](https://coquette-aesthetic-symbols-52.pages.dev/)
- [COQUETTE BOW RIBBON](https://baroque-font-vault-96.pages.dev/symbol/coquette-bow-ribbon/)
- [ANGEL WINGS HEART](https://gothic-bio-fonts-13.pages.dev/symbol/angel-wings-heart/)
- [COQUETTE BOW RIBBON](https://gothic-bio-fonts-86.pages.dev/symbol/coquette-bow-ribbon/)
- [BLACK STAR](https://kawaii-kaomoji-hub-93.pages.dev/symbol/black-star/)
- [ANGEL WINGS HEART](https://minimal-star-symbols-25.pages.dev/symbol/angel-wings-heart/)
- [CROSSED SWORDS](https://angelic-bio-symbols-59.pages.dev/symbol/crossed-swords/)
- [RIBBON HEART FONTS 86.PAGES.DEV](https://ribbon-heart-fonts-86.pages.dev/)
- [LACE HEART KAOMOJI 64.PAGES.DEV](https://lace-heart-kaomoji-64.pages.dev/)
- [COQUETTE BOW RIBBON](https://coquette-symbols.pages.dev/symbol/coquette-bow-ribbon/)
- [ANGEL WINGS HEART](https://angelic-bio-symbols-59.pages.dev/symbol/angel-wings-heart/)
- [PASTEL CHIBI EMOTES 23.PAGES.DEV](https://pastel-chibi-emotes-23.pages.dev/)
- [CROSSED SWORDS](https://coquette-aesthetic-symbols-14.pages.dev/symbol/crossed-swords/)
- [SCHOLARLY CROSS SYMBOLS 35.PAGES.DEV](https://scholarly-cross-symbols-35.pages.dev/)
- [ANGEL WINGS HEART](https://neon-glitch-symbols-84.pages.dev/symbol/angel-wings-heart/)
- [KAWAII KAOMOJI HUB 93.PAGES.DEV](https://kawaii-kaomoji-hub-93.pages.dev/)
- [WITCHY RUNIC TEXT 71.PAGES.DEV](https://witchy-runic-text-71.pages.dev/)
- [COQUETTE BOW RIBBON](https://vintage-coquette-text-58.pages.dev/symbol/coquette-bow-ribbon/)
- [ANGEL WINGS HEART](https://gothic-bio-fonts-86.pages.dev/symbol/angel-wings-heart/)
- [ANGEL WINGS HEART](https://raven-gothic-kaomoji-25.pages.dev/symbol/angel-wings-heart/)
- [ANGEL WINGS HEART](https://vintage-library-rune-80.pages.dev/symbol/angel-wings-heart/)
- [BLACK STAR](https://coquette-aesthetic-symbols-86.pages.dev/symbol/black-star/)
- [COQUETTE BOW RIBBON](https://scholarly-vintage-symbols-48.pages.dev/symbol/coquette-bow-ribbon/)
- [CROSSED SWORDS](https://neon-glitch-symbols-84.pages.dev/symbol/crossed-swords/)
- [COQUETTE BOW RIBBON](https://sleek-line-symbols-51.pages.dev/symbol/coquette-bow-ribbon/)
- [BLACK STAR](https://scholarly-vintage-symbols-48.pages.dev/symbol/black-star/)
- [CROSSED SWORDS](https://pastel-moe-emoticons-80.pages.dev/symbol/crossed-swords/)
- [COQUETTE BOW RIBBON](https://minimal-star-symbols-93.pages.dev/symbol/coquette-bow-ribbon/)
- [COQUETTE BOW RIBBON](https://vintage-library-rune-80.pages.dev/symbol/coquette-bow-ribbon/)
- [CLEAN AESTHETIC FONTS 73.PAGES.DEV](https://clean-aesthetic-fonts-73.pages.dev/)
- [ANGEL WINGS HEART](https://kawaii-kaomoji-hub-93.pages.dev/symbol/angel-wings-heart/)
- [CROSSED SWORDS](https://sleek-bio-symbols-51.pages.dev/symbol/crossed-swords/)
- [ANGELIC BIO SYMBOLS 59.PAGES.DEV](https://angelic-bio-symbols-59.pages.dev/)
- [ANGEL WINGS HEART](https://sleek-line-symbols-51.pages.dev/symbol/angel-wings-heart/)
- [ANGEL WINGS HEART](https://coquette-aesthetic-symbols-86.pages.dev/symbol/angel-wings-heart/)
- [BLACK STAR](https://anime-sparkle-text-23.pages.dev/symbol/black-star/)
- [CROSSED SWORDS](https://scholarly-cross-symbols-35.pages.dev/symbol/crossed-swords/)
- [BLACK STAR](https://clean-dot-aesthetic-48.pages.dev/symbol/black-star/)
- [CROSSED SWORDS](https://anime-sparkle-text-22.pages.dev/symbol/crossed-swords/)
- [ANGEL WINGS HEART](https://vintage-coquette-text-58.pages.dev/symbol/angel-wings-heart/)
- [BLACK STAR](https://kawaii-kaomoji-hub-96.pages.dev/symbol/black-star/)
- [COQUETTE BOW RIBBON](https://raven-gothic-kaomoji-25.pages.dev/symbol/coquette-bow-ribbon/)
- [COQUETTE AESTHETIC SYMBOLS 14.PAGES.DEV](https://coquette-aesthetic-symbols-14.pages.dev/)
- [CROSSED SWORDS](https://cyberpunk-clan-tags-43.pages.dev/symbol/crossed-swords/)
- [ANGEL WINGS HEART](https://soft-bow-fonts-22.pages.dev/symbol/angel-wings-heart/)
- [BLACK STAR](https://scholarly-cross-symbols-35.pages.dev/symbol/black-star/)
- [GOTHIC BIO FONTS 86.PAGES.DEV](https://gothic-bio-fonts-86.pages.dev/)
- [BLACK STAR](https://occult-aesthetic-symbols-26.pages.dev/symbol/black-star/)
- [BLACK STAR](https://clean-aesthetic-fonts-33.pages.dev/symbol/black-star/)
- [COQUETTE BOW RIBBON](https://cyber-clan-tags-90.pages.dev/symbol/coquette-bow-ribbon/)
- [CROSSED SWORDS](https://cyber-clan-tags-90.pages.dev/symbol/crossed-swords/)
- [CROSSED SWORDS](https://angelic-bow-symbols-42.pages.dev/symbol/crossed-swords/)
- [BLACK STAR](https://vintage-coquette-text-58.pages.dev/symbol/black-star/)
- [COQUETTE BOW RIBBON](https://pastel-moe-emoticons-80.pages.dev/symbol/coquette-bow-ribbon/)
- [COQUETTE BOW RIBBON](https://pearl-girly-fonts-86.pages.dev/symbol/coquette-bow-ribbon/)
- [BLACK STAR](https://raven-gothic-kaomoji-25.pages.dev/symbol/black-star/)
- [COQUETTE BOW RIBBON](https://pastel-manga-symbols-57.pages.dev/symbol/coquette-bow-ribbon/)
- [COQUETTE BOW RIBBON](https://kawaii-kaomoji-hub-93.pages.dev/symbol/coquette-bow-ribbon/)
- [CROSSED SWORDS](https://witchy-runic-text-71.pages.dev/symbol/crossed-swords/)
- [CROSSED SWORDS](https://raven-gothic-kaomoji-25.pages.dev/symbol/crossed-swords/)
- [ANGEL WINGS HEART](https://pastel-chibi-emotes-23.pages.dev/symbol/angel-wings-heart/)
- [CROSSED SWORDS](https://dark-literary-kaomoji-13.pages.dev/symbol/crossed-swords/)
- [BLACK STAR](https://vintage-scholar-text-15.pages.dev/symbol/black-star/)
- [ANGEL WINGS HEART](https://kawaii-kaomoji-hub-80.pages.dev/symbol/angel-wings-heart/)
- [ANGEL WINGS HEART](https://glitch-font-studio-46.pages.dev/symbol/angel-wings-heart/)
- [CROSSED SWORDS](https://pearl-girly-fonts-86.pages.dev/symbol/crossed-swords/)
- [CROSSED SWORDS](https://clean-aesthetic-fonts-33.pages.dev/symbol/crossed-swords/)
- [BLACK STAR](https://gothic-bio-fonts-14.pages.dev/symbol/black-star/)
- [ANIME SPARKLE TEXT 22.PAGES.DEV](https://anime-sparkle-text-22.pages.dev/)
- [SLEEK LINE SYMBOLS 51.PAGES.DEV](https://sleek-line-symbols-51.pages.dev/)
- [BLACK STAR](https://pastel-chibi-emotes-23.pages.dev/symbol/black-star/)
- [CROSSED SWORDS](https://coquette-aesthetic-symbols-52.pages.dev/symbol/crossed-swords/)
- [RAVEN GOTHIC KAOMOJI 25.PAGES.DEV](https://raven-gothic-kaomoji-25.pages.dev/)
- [CROSSED SWORDS](https://matrix-glitch-text-37.pages.dev/symbol/crossed-swords/)
- [BLACK STAR](https://coquette-symbols.pages.dev/symbol/black-star/)
- [ANIME SPARKLE TEXT 73.PAGES.DEV](https://anime-sparkle-text-73.pages.dev/)
- [BLACK STAR](https://neon-futuristic-symbols-58.pages.dev/symbol/black-star/)
- [COQUETTE BOW RIBBON](https://kawaii-kaomoji-hub-80.pages.dev/symbol/coquette-bow-ribbon/)
- [BLACK STAR](https://chibi-emoticon-lab-65.pages.dev/symbol/black-star/)
- [COQUETTE BOW RIBBON](https://clean-aesthetic-fonts-33.pages.dev/symbol/coquette-bow-ribbon/)
- [COQUETTE BOW RIBBON](https://ribbon-heart-fonts-86.pages.dev/symbol/coquette-bow-ribbon/)
- [CROSSED SWORDS](https://ribbon-heart-fonts-86.pages.dev/symbol/crossed-swords/)
- [COQUETTE BOW RIBBON](https://monochrome-text-lab-86.pages.dev/symbol/coquette-bow-ribbon/)
- [BLACK STAR](https://vintage-angel-symbols-66.pages.dev/symbol/black-star/)
- [COQUETTE BOW RIBBON](https://occult-aesthetic-symbols-26.pages.dev/symbol/coquette-bow-ribbon/)
- [OCCULT AESTHETIC SYMBOLS 26.PAGES.DEV](https://occult-aesthetic-symbols-26.pages.dev/)
- [CROSSED SWORDS](https://mecha-blade-symbols-46.pages.dev/symbol/crossed-swords/)
- [ANGEL WINGS HEART](https://cyber-clan-tags-23.pages.dev/symbol/angel-wings-heart/)
- [CROSSED SWORDS](https://anime-sparkle-text-73.pages.dev/symbol/crossed-swords/)
- [BLACK STAR](https://kawaii-kaomoji-hub-80.pages.dev/symbol/black-star/)
- [ANGEL WINGS HEART](https://anime-sparkle-text-22.pages.dev/symbol/angel-wings-heart/)
- [BLACK STAR](https://futuristic-gaming-fonts-52.pages.dev/symbol/black-star/)
- [BLACK STAR](https://mecha-synth-kaomoji-92.pages.dev/symbol/black-star/)
- [CROSSED SWORDS](https://vintage-library-rune-80.pages.dev/symbol/crossed-swords/)
- [BLACK STAR](https://gothic-bio-fonts-13.pages.dev/symbol/black-star/)
- [ANGEL WINGS HEART](https://coquette-aesthetic-symbols-52.pages.dev/symbol/angel-wings-heart/)
