link with . http://example.com/hello-world.

link with ! http://example.com/hello-world!

link with : http://example.com/hello-world:

link with , http://example.com/hello-world,

link with ; http://example.com/hello-world;

link with ) http://example.com/hello-world)

link with nothing http://example.com/hello-world

### Example 597

The scheme http will be inserted automatically:

www.commonmark.org

### Example 598

After a valid domain, zero or more non-space non-< characters may follow:

Visit www.commonmark.org/help for more information.

### Example 599

Trailing punctuation (specifically, ?, !, ., ,, :, \*, \_, and ~) will not be considered part of the autolink, though they may be included in the interior of the link:

Visit www.commonmark.org.

Visit www.commonmark.org/a.b.

### Example 600

www.google.com/search?q=Markup+(business)

(www.google.com/search?q=Markup+(business))

### Example 601

www.google.com/search?q=(business))+ok

### Example 602

www.google.com/search?q=commonmark&hl=en

www.google.com/search?q=commonmark&amp;

### Example 603

< immediately ends an autolink.

www.commonmark.org/he<lp

### Example 604

http://commonmark.org

(Visit https://encrypted.google.com/search?q=Markup+(business))

Anonymous FTP is available at ftp://foo.bar.baz.

Extended email autolinks:

### Example 605

foo@bar.baz

### Example 606

hello@mail+xyz.example isn't valid, but hello+xyz@mail.example is.

### Example 607

a.b-c_d@a.b

a.b-c_d@a.b.

a.b-c_d@a.b-

    a.b-c_d@a.b_
