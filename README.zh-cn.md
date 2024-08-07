<a href="https://marked.js.org">
  <img width="60px" height="60px" src="https://marked.js.org/img/logo-black.svg" align="right" />
</a>

# Marked

[![npm](https://badgen.net/npm/v/marked)](https://www.npmjs.com/package/marked)
[![gzip size](https://badgen.net/badgesize/gzip/https://cdn.jsdelivr.net/npm/marked/marked.min.js)](https://cdn.jsdelivr.net/npm/marked/marked.min.js)
[![install size](https://badgen.net/packagephobia/install/marked)](https://packagephobia.now.sh/result?p=marked)
[![downloads](https://badgen.net/npm/dt/marked)](https://www.npmjs.com/package/marked)
[![github actions](https://github.com/markedjs/marked/workflows/Tests/badge.svg)](https://github.com/markedjs/marked/actions)
[![snyk](https://snyk.io/test/npm/marked/badge.svg)](https://snyk.io/test/npm/marked)

- ⚡ 为速度而生
- ⬇️ 无需缓存或长时间卡顿的低级 Markdown 编译器
- ⚖️ 在支持所有官方及方言特性的同时仍保持轻量
- 🌐 在浏览器/服务器/命令行中皆可运行

## 演示

在 [演示页面](https://marked.js.org/demo/) 可即刻体验Marked ⛹️

## Docs

我们的 [文档页面(已翻译)](https://marked.js.org/translations/zh-cn/) 也是通过 Marked 编译的 💯

另可参阅:

- [选项](https://marked.js.org/using_advanced)
- [拓展](https://marked.js.org/using_pro)

## 兼容性

**Node.js:** 仅支持 [最新 与 长期支持(LTS)](https://nodejs.org/en/about/releases/) Node.js 版本。 Marked 随时可能变得与停止支持的 Node.js 版本不兼容。

**浏览器:** 不支持 IE11 :)

## 安装

**命令行:**

```sh
npm install -g marked
```

**在浏览器中:**

```sh
npm install marked
```

## Usage

**请注意：Marked 不会 [“消毒”](./using_advanced.md#options) 输出结果。如果你在处理不安全的字符串，则XSS攻击过滤非常重要。一些可用的过滤器有 [DOMPurify](https://github.com/cure53/DOMPurify) (建议)，[js-xss](https://github.com/leizongmin/js-xss)，[sanitize-html](https://github.com/apostrophecms/sanitize-html)，和 [insane](https://github.com/bevacqua/insane)。**

```javascript
DOMPurify.sanitize(marked.parse(`<img src="x" onerror="alert('这不会发生')">`));
```

### 命令行用法

```bash
# 终端输入
$ marked -o hello.html
Hello World
^D
$ cat hello.html
<p>Hello World</p>
```

```bash
# 展示所有参数
$ marked --help
```

### 浏览器用法

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
      marked.parse('# 浏览器中的 Marked\n\n使用 **Marked** 渲染。');
  </script>
</body>
</html>
```

或者导入 ESM 模块

```html
<script type="module">
  import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";
  document.getElementById('content').innerHTML =
    marked.parse('# 浏览器中的 Marked\n\n使用 **Marked** 渲染。');
</script>
```

## 著作权 & 许可协议

(以下保留原文)

Copyright (c) 2011-2022, Christopher Jeffrey. (MIT License)
