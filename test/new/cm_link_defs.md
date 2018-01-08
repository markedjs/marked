### Example 159

[foo159]: /url "title"

[foo159]

### Example 160

   [foo160]: 
      /url  
           'the title'  

[foo160]

### Example 161

[Foo161*bar\]]:my_(url) 'title (with parens)'

[Foo161*bar\]]

### Example 162

[Foo162 bar]:
<my%20url>
'title'

[Foo162 bar]

### Example 163

[foo163]: /url '
title
line1
line2
'

[foo163]

### Example 164

[foo164]: /url 'title

with blank line'

[foo164]

### Example 165

[foo165]:
/url

[foo165]

### Example 166

[foo166]:

[foo166]

### Example 167

	[foo167]: /url\bar\*baz "foo\"bar\baz"

	[foo167]

	should render to

	<p><a href="/url%5Cbar*baz" title="foo&quot;bar\baz">foo167</a></p>

### Example 168

[foo168]

[foo168]: url

### Example 169

[foo169]

[foo169]: first
[foo169]: second

### Example 170

[FOO170]: /url

[Foo170]

### Example 171

[ΑΓΩ]: /φου

[αγω]

### Example 172

[foo172]: /url

### Example 173

[
foo173
]: /url
bar

### Example 174

[foo174]: /url "title" ok

### Example 175

[foo175]: /url
"title" ok

### Example 176

    [foo176]: /url "title"

[foo176]

### Example 177

```
[foo177]: /url
```

[foo177]

### Example 178

Foo
[bar178]: /baz

[bar178]

### Example 179

# [Foo179]
[foo179]: /url
> bar

### Example 180

[foo180]: /foo-url "foo"
[bar180]: /bar-url
  "bar"
[baz180]: /baz-url

[foo180],
[bar180],
[baz180]

### Example 181

[foo181]

> [foo181]: /url