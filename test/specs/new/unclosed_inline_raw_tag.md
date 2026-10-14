---
renderExact: true
---
an unclosed <code> tag

does not leak into the next paragraph: 1 < 2 & 3 > 2

an unclosed <pre> tag

# does not leak into a heading: 1 < 2 & 3 > 2

an unclosed <kbd> tag

- does not leak into a list item: 1 < 2 & 3 > 2

within a paragraph <code>a & b</code> is still raw, as is
<code>a & b
across a line</code> but not after it: 1 < 2
