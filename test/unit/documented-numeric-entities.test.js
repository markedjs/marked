import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { runInNewContext } from 'node:vm';
import { Marked } from '../../lib/marked.esm.js';

const docs = readFileSync(new URL('../../docs/USING_PRO.md', import.meta.url), 'utf8');
const section = docs.split('<h3 id="numeric-character-references">')[1];
const example = section.match(/```js\n([\s\S]*?)\n```/)[1];

function documentedMarked() {
  return runInNewContext(`${example.replace("import { Marked } from 'marked';", '')}\nmarked;`, {
    Marked,
    console: { log() {} },
  });
}

describe('documented numeric character reference extension', () => {
  it('preserves decimal and hexadecimal references after ordinary text', () => {
    const marked = documentedMarked();
    const input = 'before &#27;[2J and &#x1b;[2J and &#X1B;[2J after';
    const tokens = marked.lexer(input)[0].tokens;
    assert.deepEqual(tokens.filter(token => token.type === 'numericEntity').map(token => token.text), ['&#27;', '&#x1b;', '&#X1B;']);
    assert.equal(tokens.map(token => token.raw).join(''), input);
    assert.ok(tokens.every(token => !token.text.includes('\u001b')));
  });

  it('keeps the default decoding behavior unchanged', () => {
    const input = 'before &#27;[2J after';
    const token = new Marked().lexer(input)[0].tokens[0];
    assert.equal(token.raw, input);
    assert.equal(token.text, 'before \u001b[2J after');
  });

  it('preserves nested inline references and renders their original spelling', () => {
    const marked = documentedMarked();
    const input = '**before &#65; and &#x42; after**';
    const strong = marked.lexer(input)[0].tokens[0];
    assert.deepEqual(strong.tokens.filter(token => token.type === 'numericEntity').map(token => token.text), ['&#65;', '&#x42;']);
    assert.equal(marked.parse(input), '<p><strong>before &#65; and &#x42; after</strong></p>\n');
  });

  it('leaves code spans and malformed references to their existing tokenizers', () => {
    const marked = documentedMarked();
    const input = '`&#27;` &amp; &#; &#x; &#27 &#12345678; &#x1234567;';
    const tokens = marked.lexer(input)[0].tokens;
    assert.equal(tokens[0].type, 'codespan');
    assert.equal(tokens[0].text, '&#27;');
    assert.ok(tokens.every(token => token.type !== 'numericEntity'));
    assert.equal(marked.parse(input), new Marked().parse(input));
  });
});
