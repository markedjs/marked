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

### Example 5030

[foo [bar](/uri)][ref503]

[ref503]: /uri

### Example 504

[foo *bar [baz][ref504]*][ref504]

[ref504]: /uri

### Example 506

[foo *bar][ref]

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

[foo513] [bar513]

[bar513]: /url "title"

### Example 514

[foo514]
[bar514]

[bar514]: /url "title"

### Example 515

[foo515]: /url1

[foo515]: /url2

[bar][foo515]

### Example 516

[bar][foo\!516]

[foo!516]: /url

### Example 517

[foo517][ref[517]

[ref[517]: /uri

### Example 518

[foo518][ref[bar518]518]

[ref[bar518]518]: /uri

### Example 519

[[[foo519]]]

[[[foo519]]]: /url

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

[[bar [foo531]

[foo531]: /url

### Example 532

[Foo]

[foo]: /url "title"

### Example 533

[foo533] bar

[foo533]: /url

### Example 534

\[foo]

[foo534]: /url "title"

### Example 536

[foo536][bar536]

[foo536]: /url1
[bar536]: /url2

### Example 537

[foo537][]

[foo537]: /url1

### Example 538

[foo538]()

[foo538]: /url1

### Example 539

[foo539](not a link)

[foo539]: /url1

### Example 540

[foo540][bar540][baz540]

[baz540]: /url

### Example 541

[foo541][bar541][baz541]

[baz541]: /url1
[bar541]: /url2

### Example 542

[foo542][bar542][baz542]

[baz542]: /url1
[foo542]: /url2

### Example 543

![foo543](/url "title")

### Example 5440

![foo *bar*544]

[foo *bar*544]: train.jpg "train & tracks"

### Example 5450

![foo ![bar](/url)](/url2)

### Example 5460

![foo [bar](/url)](/url2)

### Example 5470

![foo *bar*547][]

[foo *bar*547]: train.jpg "train & tracks"

### Example 5480

![foo *bar*][foobar548]

[FOOBAR548]: train.jpg "train & tracks"

### Example 549

![foo](train.jpg)

### Example 550

My ![foo bar](/path/to/train.jpg  "title"   )

### Example 551

![foo](<url>)

### Example 552

![](/url)

### Example 553

![foo][bar553]

[bar553]: /url

### Example 554

![foo][bar554]

[BAR554]: /url

### Example 555

![foo][]

[foo]: /url "title"

### Example 5560

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

### Example 5600

![*foo* bar]

[*foo* bar]: /url "title"

### Example 561

![[foo561]]

[[foo561]]: /url "title"

### Example 562

![Foo]

[foo]: /url "title"

### Example 563

!\[foo]

[foo]: /url "title"

### Example 564

\![foo]

[foo]: /url "title"

