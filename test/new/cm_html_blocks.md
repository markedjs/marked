HTML blocks
===================

### Example 116

<table><tr><td>
<pre>
**Hello**,

_world_.
</pre>
</td></tr></table>

### Example 117

<table>
  <tr>
    <td>
           hi
    </td>
  </tr>
</table>

okay.

### Example 118

 <div>
  *hello*
         <foo><a>

### Example 119

</div>
*foo*

### Example 120

<DIV CLASS="foo">

*Markdown*

</DIV>

### Example 121

<div id="foo"
  class="bar">
</div>

### Example 122

<div id="foo" class="bar
  baz">
</div>

### Example 123

<div>
*foo*

*bar*

### Example 124

<div id="foo"
*hi*

### Example 125

<div class
foo

### Example 126

<div *???-&&&-<---
*foo*

### Example 127

<div><a href="bar">*foo*</a></div>

### Example 128

<table><tr><td>
foo
</td></tr></table>

### Example 129

<div></div>
``` c
int x = 33;
```

### Example 130

<a href="foo">
*bar*
</a>

### Example 131

<Warning>
*bar*
</Warning>

### Example 132

<i class="foo">
*bar*
</i>

### Example 133

</ins>
*bar*

### Example 134

<del>
*foo*
</del>

### Example 135

<del>

*foo*

</del>

### Example 136

<del>*foo*</del>

### Example 137

<pre language="haskell"><code>
import Text.HTML.TagSoup

main :: IO ()
main = print $ parseTags tags
</code></pre>
okay

### Example 138

<script type="text/javascript">
// JavaScript example

document.getElementById("demo").innerHTML = "Hello JavaScript!";
</script>
okay

### Example 139

<style
  type="text/css">
h1 {color:red;}

p {color:blue;}
</style>
okay

### Example 141

> <div>
> foo

bar

### Example 142

- <div>
- foo

### Example 143

<style>p{color:red;}</style>
*foo*

### Example 144

<!-- foo -->*bar*
*baz*

### Example 145

<script>
foo
</script>1. *bar*

### Example 146

<!-- Foo

bar
   baz -->
okay

### Example 147

<?php

  echo '>';

?>
okay

### Example 148

<!DOCTYPE html>

### Example 149

<![CDATA[
function matchwo(a,b)
{
  if (a < b && a < 0) then {
    return 1;

  } else {

    return 0;
  }
}
]]>
okay

### Example 150

  <!-- foo -->

    <!-- foo -->

### Example 151

  <div>

    <div>

### Example 152

Foo
<div>
bar
</div>

### Example 153

<div>
bar
</div>
*foo*

### Example 154

Foo
<a href="bar">
baz

### Example 155

<div>

*Emphasized* text.

</div>

### Example 156

<div>
*Emphasized* text.
</div>

### Example 157

<table>

<tr>

<td>
Hi
</td>

</tr>

</table>

### Example 158

<table>

  <tr>

    <td>
      Hi
    </td>

  </tr>

</table>

### Example 140

If there is no matching end tag, the block will end at the end of the document (or the enclosing block quote or list item):

<style
  type="text/css">

foo