### Example 191

> # Foo
> bar
> baz

### Example 192

The spaces after the `>` characters can be omitted:

># Bar
>bar
> baz

### Example 193

The `>` characters can be indented 1-3 spaces:

   > # Baz
   > bar
 > baz

### Example 194

Four spaces gives us a code block:

    > # Qux
    > bar
    > baz

### Example 195

The Laziness clause allows us to omit the `>` before paragraph continuation text:

> # Quux
> bar
baz

### Example 196

A block quote can contain some lazy and some non-lazy continuation lines:

> bar
baz
> foo

### Example 197

Laziness only applies to lines that would have been continuations of paragraphs had they been prepended with block quote markers. For example, the `>` cannot be omitted in the second line of

> foo
---

without changing the meaning.

### Example 198

    Similarly, if we omit the `>` in the second line then the block quote ends after the first line:

    > - foo
    - bar

### Example 199

For the same reason, we can’t omit the `>` in front of subsequent lines of an indented or fenced code block:

>     foo

    bar

### Example 200

    > ```
    foo
    ```

    <blockquote>
    <pre><code></code></pre>
    </blockquote>
    <p>foo</p>
    <pre><code></code></pre>

### Example 201

    > foo
        - bar

    <blockquote>
    <p>foo
    - bar</p>
    </blockquote>

### Example 202

A block quote can be empty:

>

### Example 203

>
>  
> 

### Example 204

A block quote can have initial or final blank lines:

>
> foo
>  

### Example 205

A blank line always separates block quotes:

> foo

> bar

### Example 206

Consecutiveness means that if we put these block quotes together, we get a single block quote:

> foo
> bar

### Example 207

To get a block quote with two paragraphs, use:

> foo
>
> bar

### Example 208

Block quotes can interrupt paragraphs:

foo
> bar

### Example 209

In general, blank lines are not needed before or after block quotes:

> aaa
***
> bbb

### Example 210

However, because of laziness, a blank line is needed between a block quote and a following paragraph:

> bar
baz

### Example 211

> bar

baz

### Example 212

> bar
>
baz

### Example 213

It is a consequence of the Laziness rule that any number of initial `>`s may be omitted on a continuation line of a nested block quote:

> > > foo
bar

### Example 214

>>> foo
> bar
>>baz

### Example 215

When including an indented code block in a block quote, remember that the block quote marker includes both the `>` and a following space. So five spaces are needed after the `>`:

>     code

>    not code
