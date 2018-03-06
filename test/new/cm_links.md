---
xhtml: true
---

Links
===================

### Example 459

[link](/uri "title")

### Example 460

[link](/uri)

### Example 461

[link]()

### Example 462

[link](<>)

### Example 463

[link](/my uri)

### Example 464

[link](</my uri>)

### Example 465

[link](foo
bar)

### Example 466

[link](<foo
bar>)

### Example 467

[link](\(foo\))

### Example 4680

ONE LEVEL of parentheses are allowed without escaping, as long as they are balanced:

[link](foo(bar))

### Example 469

[link](foo\(and\(bar\))

### Example 470

However, if you have ANY unbalanced parentheses, you need to escape or use the <...> form:

[link](<foo(and(bar)>)

### Example 471

[link](foo\)\:)

### Example 472

[link](#fragment)

[link](http://example.com#fragment)

[link](http://example.com?foo=3#frag)

### Example 473

[link](foo\bar)

### Example 4740

[link](foo%20b&auml;)

### Example 475

[link]("title")

### Example 476

[link](/url "title")
[link](/url 'title')
[link](/url (title))

### Example 477

[link](/url "title \"&quot;")

### Example 479

[link](/url "title "and" title")

### Example 480

[link](/url 'title "and" title')

### Example 481

[link](   /uri
  "title"  )

### Example 482

[link] (/uri)

### Example 4830

The link text may contain ONE LEVEL of balanced brackets, but not unbalanced ones, unless they are escaped:

[link [foo4830]](/uri)

### Example 484

[link] bar](/uri)

### Example 485

[link [bar](/uri)

### Example 486

[link \[bar](/uri)

### Example 487

[link *foo **bar** `#`*](/uri)

### Example 488

[![moon](moon.jpg)](/uri)

### Example 493

[foo *bar](baz*)

### Example 494

*foo [bar* baz]

### Example 498

[foo][bar]

[bar]: /url "title"

### Example 4990

[link [foo499]][ref499]

[ref499]: /uri

### Example 500

[link \[bar][ref]

[ref]: /uri

### Example 501

[link *foo **bar** `#`*][ref]

[ref]: /uri

### Example 502

[![moon](moon.jpg)][ref]

[ref]: /uri

### Example 503

[foo [bar](/uri)][ref]

[ref]: /uri

### Example 504

[foo *bar [baz][ref]*][ref]

[ref]: /uri

### Example 505

*[foo*][ref]

[ref]: /uri

### Example 506

[foo *bar][ref]

[ref]: /uri

### Example 507

[foo <bar attr="][ref]">

[ref]: /uri

### Example 508

[foo`][ref]`

[ref]: /uri

### Example 509

[foo<http://example.com/?search=][ref]>

[ref]: /uri

### Example 510

[foo][BaR]

[bar]: /url "title"

### Example 511

[Толпой][Толпой] is a Russian word.

[ТОЛПОЙ]: /url

### Example 512

[Foo
  bar]: /url

[Baz][Foo bar]

### Example 513

[foo] [bar]

[bar]: /url "title"

### Example 514

[foo]
[bar]

[bar]: /url "title"

### Example 515

[foo]: /url1

[foo]: /url2

[bar][foo]

### Example 516

[bar][foo\!]

[foo!]: /url

### Example 517

[foo][ref[]

[ref[]: /uri

### Example 518

[foo][ref[bar]]

[ref[bar]]: /uri

### Example 519

[[[foo]]]

[[[foo]]]: /url

### Example 520

[foo][ref\[]

[ref\[]: /uri

### Example 521

[bar\\]: /uri

[bar\\]

### Example 522

[]

[]: /uri

### Example 523

[
 ]

[
 ]: /uri

### Example 524

[foo][]

[foo]: /url "title"

### Example 525

[*foo* bar][]

[*foo* bar]: /url "title"

### Example 526

[Foo][]

[foo]: /url "title"

### Example 527

[foo] 
[]

[foo]: /url "title"

### Example 528

[foo]

[foo]: /url "title"

### Example 529

[*foo* bar]

[*foo* bar]: /url "title"

### Example 530

[[*foo* bar]]

[*foo* bar]: /url "title"

### Example 531

[[bar [foo]

[foo]: /url

### Example 532

[Foo]

[foo]: /url "title"

### Example 533

[foo] bar

[foo]: /url

### Example 534

\[foo]

[foo]: /url "title"

### Example 535

[foo*]: /url

*[foo*]

### Example 536

[foo][bar]

[foo]: /url1
[bar]: /url2

### Example 537

[foo][]

[foo]: /url1

### Example 538

[foo]()

[foo]: /url1

### Example 539

[foo](not a link)

[foo]: /url1

### Example 540

[foo][bar][baz]

[baz]: /url

### Example 541

[foo][bar][baz]

[baz]: /url1
[bar]: /url2

### Example 542

[foo][bar][baz]

[baz]: /url1
[foo]: /url2

### Example 543

![foo](/url "title")

### Example 544

![foo *bar*]

[foo *bar*]: train.jpg "train & tracks"

### Example 545

![foo ![bar](/url)](/url2)

### Example 546

![foo [bar](/url)](/url2)

### Example 547

![foo *bar*][]

[foo *bar*]: train.jpg "train & tracks"

### Example 548

![foo *bar*][foobar]

[FOOBAR]: train.jpg "train & tracks"

### Example 549

![foo](train.jpg)

### Example 550

My ![foo bar](/path/to/train.jpg  "title"   )

### Example 551

![foo](<url>)

### Example 552

![](/url)

### Example 553

![foo][bar]

[bar]: /url

### Example 554

![foo][bar]

[BAR]: /url

### Example 555

![foo][]

[foo]: /url "title"

### Example 556

![*foo* bar][]

[*foo* bar]: /url "title"

### Example 557

![Foo][]

[foo]: /url "title"

### Example 558

![foo] 
[]

[foo]: /url "title"

### Example 559

![foo]

[foo]: /url "title"

### Example 560

![*foo* bar]

[*foo* bar]: /url "title"

### Example 561

![[foo]]

[[foo]]: /url "title"

### Example 562

![Foo]

[foo]: /url "title"

### Example 563

!\[foo]

[foo]: /url "title"

### Example 564

\![foo]

[foo]: /url "title"

