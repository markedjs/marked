import { Marked } from '../../lib/marked.esm.js';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

function block(interrupts = ['table', 'blockquote']) {
  return {
    name: 'customBlock',
    level: 'block',
    interrupts,
    start(src) { return src.indexOf('{{block'); },
    tokenizer(src) {
      const cap = /^\{\{block\n([\s\S]*?)\n\}\}(?:\n|$)/.exec(src);
      if (cap) return { type: 'customBlock', raw: cap[0], text: cap[1] };
    },
    renderer(token) { return `<custom>${token.text}</custom>\n`; },
  };
}

const table = 'a|b\n-|-\nx|y\n';
const custom = '{{block\nhello\n}}\n';

describe('block extension interruptions', () => {
  it('ends a table before an opted-in extension', () => {
    const marked = new Marked({ extensions: [block()] });
    assert.equal(marked.parse(table + custom), new Marked().parse(table) + '<custom>hello</custom>\n');
  });

  it('ends a blockquote before an unmarked extension', () => {
    const marked = new Marked({ extensions: [block()] });
    assert.equal(marked.parse('> quoted\n' + custom), '<blockquote>\n<p>quoted</p>\n</blockquote>\n<custom>hello</custom>\n');
  });

  it('keeps explicitly marked extensions inside their blockquote', () => {
    const marked = new Marked({ extensions: [block()] });
    assert.equal(marked.parse('> {{block\n> hello\n> }}\n'), '<blockquote>\n<custom>hello</custom>\n</blockquote>\n');
  });

  it('does not interrupt the table header or delimiter', () => {
    const marked = new Marked({ extensions: [block()] });
    const src = '{{block|b\n-|-\nx|y\n';
    assert.equal(marked.parse(src), new Marked().parse(src));
  });

  it('does not interrupt at a marker inside a table cell', () => {
    const marked = new Marked({ extensions: [block()] });
    const src = table + '|{{block|cell\nhello|world\n';
    assert.equal(marked.parse(src), new Marked().parse(src));
  });

  it('finds a later line start after an in-cell hint', () => {
    const marked = new Marked({ extensions: [block()] });
    const prefix = table + '|{{block|cell\nhello|world\n';
    assert.equal(marked.parse(prefix + custom), new Marked().parse(prefix) + '<custom>hello</custom>\n');
  });

  it('keeps old extensions unchanged unless they opt in', () => {
    const old = block();
    delete old.interrupts;
    const marked = new Marked({ extensions: [old] });
    assert.equal(marked.parse(table + custom), new Marked().parse(table + custom));
    assert.equal(marked.parse('> quoted\n' + custom), '<blockquote>\n<p>quoted</p>\n<custom>hello</custom>\n</blockquote>\n');
  });

  it('enables targets independently', () => {
    const marked = new Marked({ extensions: [block(['table'])] });
    assert.equal(marked.parse(table + custom), new Marked().parse(table) + '<custom>hello</custom>\n');
    assert.equal(marked.parse('> quoted\n' + custom), '<blockquote>\n<p>quoted</p>\n<custom>hello</custom>\n</blockquote>\n');
  });

  it('can interrupt a header-only table', () => {
    const marked = new Marked({ extensions: [block()] });
    const header = 'a|b\n-|-\n';
    assert.equal(marked.parse(header + custom), new Marked().parse(header) + '<custom>hello</custom>\n');
  });

  it('preserves explicit quote nesting while ending lazy continuation', () => {
    const marked = new Marked({ extensions: [block()] });
    assert.equal(marked.parse('> > quoted\n' + custom), '<blockquote>\n<blockquote>\n<p>quoted</p>\n</blockquote>\n</blockquote>\n<custom>hello</custom>\n');
    assert.equal(marked.parse('> > quoted\n> {{block\n> hello\n> }}\n'), '<blockquote>\n<blockquote>\n<p>quoted</p>\n</blockquote>\n<custom>hello</custom>\n</blockquote>\n');
  });

  it('leaves explicitly quoted fenced code literal', () => {
    const marked = new Marked({ extensions: [block()] });
    const src = '> ```\n> {{block\n> hello\n> }}\n> ```\n';
    assert.equal(marked.parse(src), new Marked().parse(src));
  });

  it('preserves table cell inline tokens before the boundary', () => {
    const marked = new Marked({ extensions: [block()] });
    const prefix = 'a|b\n-|-\n**bold**|[link](url)\n';
    assert.equal(marked.parse(prefix + custom), new Marked().parse(prefix) + '<custom>hello</custom>\n');
  });

  it('supports a start hint pointing to the preceding newline', () => {
    const ext = block();
    ext.start = src => src.indexOf('\n{{block');
    const marked = new Marked({ extensions: [ext] });
    assert.equal(marked.parse(table + custom), new Marked().parse(table) + '<custom>hello</custom>\n');
  });

  it('merges interruption callbacks across use calls', () => {
    const marked = new Marked({ extensions: [block(['table'])] });
    const other = block(['blockquote']);
    other.name = 'otherBlock';
    marked.use({ extensions: [other] });
    assert.equal(marked.parse(table + custom), new Marked().parse(table) + '<custom>hello</custom>\n');
    assert.equal(marked.parse('> quoted\n' + custom), '<blockquote>\n<p>quoted</p>\n</blockquote>\n<custom>hello</custom>\n');
  });

  it('supports newline-prefixed hints immediately after the table delimiter', () => {
    const ext = block();
    ext.start = src => src.indexOf('\n{{block');
    const header = 'a|b\n-|-\n';
    assert.equal(new Marked({ extensions: [ext] }).parse(header + custom), new Marked().parse(header) + '<custom>hello</custom>\n');
  });

  it('skips many hints on the same line and still finds a boundary', () => {
    const prefix = table + '|' + '{{block'.repeat(10000) + '|cell\n';
    assert.equal(new Marked({ extensions: [block()] }).parse(prefix + custom), new Marked().parse(prefix) + '<custom>hello</custom>\n');
  });

  it('preserves a table followed by blank lines when no extension matches', () => {
    const src = table + '\n\n# heading\n';
    assert.equal(new Marked({ extensions: [block()] }).parse(src), new Marked().parse(src));
  });

  for (const hint of [undefined, -1, NaN, Infinity, 0.5, 1e9]) {
    it(`ignores invalid interruption offsets: ${hint}`, () => {
      const ext = block();
      ext.start = () => hint;
      const src = table + 'ordinary\n';
      assert.equal(new Marked({ extensions: [ext] }).parse(src), new Marked().parse(src));
    });
  }

  it('rejects interruptions without a block start function', () => {
    const ext = block();
    delete ext.start;
    assert.throws(() => new Marked({ extensions: [ext] }), /interrupts requires/);
    assert.throws(() => new Marked({ extensions: [{ ...block(), level: 'inline' }] }), /interrupts requires/);
  });

  it('rejects unsupported targets', () => {
    assert.throws(() => new Marked({ extensions: [{ ...block(), interrupts: ['code'] }] }), /interrupts target/);
  });
});
