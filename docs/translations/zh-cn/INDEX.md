<!-- cspell: ignoreRegExp [0-9A-F]{4} -->

# Marked官方文档 - 入门

## 译注

高中生，托福81，“计算机科学”学科的高中毕业论文项目是自制一个简化版Marked，因此需要大量参考Marked文档，为自己方便而翻译。在此发表也是为了抛砖引玉，希望能有更专业的人士接手这份工作，提供更好的翻译以及其他语言的翻译。

因此，我翻译的范围亦仅限于Marked文档本身，文档中的外部链接和非文档链接均保留原样并标注了斜体的(*英文*)字样。

本人并非语言学专业，难以做到专业翻译水准。“信达雅”之中，我尽量保证“信”，即尽可能有效地传递英语原文所包含的所有信息。也因此，文档中我补充了一部分说明，修正了部分原文的语法错误。且同样会加上(*补充*)，(*语法修正*)等标注。

本文是参考文档从头开始编写的，没有复制原版格式，部分样式细节可能会有些许不同。

我没有多少时间进行完整校对，所以遇到问题时（大部分应该是链接无效）还烦请告诉[我](https://github.com/minecraftfen)。

——[Ivor](https://github.com/minecraftfen)

## 简介

Marked 是一个

1. 为速度而生（“速度”的判定标准仍在制定）
2. 无需缓存或长时间卡顿的低级 Markdown 编译器（使用了尽可能少的外部依赖）
3. 在支持所有官方及方言特性的同时仍保持轻量（严格模式可能较慢）
4. 自带命令行界面，且可作为客户端/服务端 JavaScript 项目的一部分

## 演示

在 [演示页面(*英文*)](https://marked.js.org/demo/) 可即刻体验Marked

这些文档页面也是通过 Marked 编译的

## 安装

命令行: `npm install -g marked`

在浏览器中：

```bash
npm install marked
```

## 用法

**请注意：Marked 不会 [“消毒”](./using_advanced.md#options) 输出结果。如果你在处理不安全的字符串，则XSS攻击过滤非常重要。一些可用的过滤器有 [DOMPurify](https://github.com/cure53/DOMPurify) (建议)，[js-xss](https://github.com/leizongmin/js-xss)，[sanitize-html](https://github.com/apostrophecms/sanitize-html)，和 [insane](https://github.com/bevacqua/insane)。(*语法修正*)(*过滤器链接均指向英文原页面*)**

```javascript
DOMPurify.sanitize(marked.parse(`<img src="x" onerror="alert('这不会发生')">`));
```

**输入：有些零宽 Unicode 字符（例如`\uFEFF`）可能会干扰解析器，一部分文本编辑器会在纯文本文件的开始添加它们（详见：[#2139(*英文*)](https://github.com/markedjs/marked/issues/2139) ）**

```javascript
// 在页首移除常见的零宽字符
marked.parse(
  contents.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/,"")
)
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
# 字符串输入
$ marked -s "*Hello World*"
<p><em>Hello World</em></p>
```

```bash
# 文件输入

echo "**粗体示例**" > readme.md

$ marked -i readme.md -o readme.html
$ cat readme.html
<p><strong>粗体示例</strong></p>
```

```bash
# 展示所有参数
$ marked --help
```

#### 命令行配置

可以使用一个配置文件来配置 Marked 命令行行为

如果配置文件拓展名是 `json` ，其内容必须是一个 Marked 配置文件 JSON 对象。

如果拓展名是 `js` ，则这个文件必须导出一个 Marked 配置文件对象，或者一个以 `marked` 作为参数的方法。

Marked 将会使用以下顺序在你的主文件夹查找配置文件：

- ~/.marked.json
- ~/.marked.js
- ~/.marked/index.js

```bash
# 自定义配置

echo '{ "breaks": true }' > config.json

$ marked -s '第一行\n第二行' -c config.json
<p>第一行<br>第二行</p>
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

### Node.js 用法

```javascript
import { marked } from 'marked';
// or const { marked } = require('marked');

const html = marked.parse('# Node.js中的 Marked\n\n使用 **Marked** 渲染。');
```

Marked 支持 [高级配置](./using_advanced.md) 和 [拓展](./using_pro.md) 。

## 受支持的 Markdown 规范

我们积极地为以下 [Markdown方言(*英文*)](https://github.com/commonmark/CommonMark/wiki/Markdown-Flavors) 提供支持

|方言|版本|状态|
|:--|:--|:--|
|最初的 [`markdown.pl`(*英文*)](https://daringfireball.net/projects/markdown/syntax)(*链接为补充*)|不适用||
|[CommonMark(*英文*)](https://spec.commonmark.org/0.31.2/)|0.31|[正在进行(*英文*)](https://github.com/markedjs/marked/issues/1202)|
|[Github风格的Markdown(*英文*)](https://github.github.com/gfm/)|0.29|[正在进行(*英文*)](https://github.com/markedjs/marked/issues/1202)|

在以上Markdown方言支持之外，Marked也可以帮助你使用其他的方言；但是社区不为这些方言积极提供支持。

## 使用了 Marked 的工具

我们积极地为 Marked 的超快 Markdown 转换可用性提供支持，现有一些工具正在使用 `Marked` 用于单页生成(*也可译为“单页创造”*)：

|工具(*链接均为英文*)|介绍|
|:--|:--|
|[zero-md](https://zerodevx.github.io/zero-md/)|原生Markdown转HTML网页组件，用于加载和显示外部 MD 文件。它使用 Marked 实现超快的 Markdown 转换。|
|[texme](https://github.com/susam/texme)|TeXMe 是一款轻量的 JavaScript 工具，用于创建自渲染 Markdown + LaTeX 文档。|
|[StrapDown.js](https://naereen.github.io/StrapDown.js/)|StrapDown.js 是一款超棒的即时 Markdown 转 HTML 文本处理器。|
|[raito](https://raito.arnaud.at/)|迷你 Markdown 维基/内容管理系统，仅使用8KB的 JavaScript 。|
|[homebrewery](https://homebrewery.naturalcrit.com/)|The Homebrewery 是一款使用 Markdown 制作仿真《龙与地下城》内容的工具。使用 MIT 协议授权。|

## 安全性

世界上唯一绝对安全的系统就是根本不存在的系统。因此，我们非常重视 Marked 的安全性。

所以，因此，请通过电子邮件向 [贡献者](./authors.md) 及 [NPM 中列出的所有者(*英文*)](https://docs.npmjs.com/cli/owner) 披露潜在的安全问题。我们将在 48 小时内初步评估反馈，并在 2 周内打上补丁（此外也欢迎提供问题修复）。
