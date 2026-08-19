---
# Character references resolve in a link destination but not in an autolink, so
# the same query string has to be escaped differently depending on where it is
# written.
#
# The `&lt;` inline links, reference links and images below do not match
# CommonMark. It resolves the reference and percent-encodes the result, giving
# `?x=1%3C2`, where marked keeps `?x=1&lt;2`. That difference comes from URL
# encoding rather than from this escaping, and it is the same on `master`.
# Everything else here matches CommonMark.
renderExact: true
---
https://example.com/?x=1&lt;2

https://example.com/?y=1&amp;2

https://example.com/?a=1&b=2

<https://example.com/?x=1&lt;2>

<https://example.com/?y=1&amp;2>

<https://example.com/?a=1&b=2>

[https://example.com/?x=1&lt;2](https://example.com/?x=1&lt;2)

[https://example.com/?y=1&amp;2](https://example.com/?y=1&amp;2)

[https://example.com/?a=1&b=2](https://example.com/?a=1&b=2)

[https://example.com/?x=1&lt;2][link1]

[https://example.com/?y=1&amp;2][link2]

[https://example.com/?a=1&b=2][link3]

![https://example.com/?x=1&lt;2](https://example.com/?x=1&lt;2)

![https://example.com/?y=1&amp;2](https://example.com/?y=1&amp;2)

![https://example.com/?a=1&b=2](https://example.com/?a=1&b=2)

[link1]: https://example.com/?x=1&lt;2
[link2]: https://example.com/?y=1&amp;2
[link3]: https://example.com/?a=1&b=2
