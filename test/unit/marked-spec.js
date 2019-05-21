const marked = require('../../lib/marked.js');

describe('Test heading ID functionality', () => {
  it('should add id attribute by default', () => {
    const renderer = new marked.Renderer();
    const slugger = new marked.Slugger();
    const header = renderer.heading('test', 1, 'test', slugger);
    expect(header).toBe('<h1 id="test">test</h1>\n');
  });

  it('should NOT add id attribute when options set false', () => {
    const renderer = new marked.Renderer({ headerIds: false });
    const header = renderer.heading('test', 1, 'test');
    expect(header).toBe('<h1>test</h1>\n');
  });
});

describe('Test slugger functionality', () => {
  it('should use lowercase slug', () => {
    const slugger = new marked.Slugger();
    expect(slugger.slug('Test')).toBe('test');
  });

  it('should be unique to avoid collisions 1280', () => {
    const slugger = new marked.Slugger();
    expect(slugger.slug('test')).toBe('test');
    expect(slugger.slug('test')).toBe('test-1');
    expect(slugger.slug('test')).toBe('test-2');
  });

  it('should be unique when slug ends with number', () => {
    const slugger = new marked.Slugger();
    expect(slugger.slug('test 1')).toBe('test-1');
    expect(slugger.slug('test')).toBe('test');
    expect(slugger.slug('test')).toBe('test-2');
  });

  it('should be unique when slug ends with hyphen number', () => {
    const slugger = new marked.Slugger();
    expect(slugger.slug('foo')).toBe('foo');
    expect(slugger.slug('foo')).toBe('foo-1');
    expect(slugger.slug('foo 1')).toBe('foo-1-1');
    expect(slugger.slug('foo-1')).toBe('foo-1-2');
    expect(slugger.slug('foo')).toBe('foo-2');
  });

  it('should allow non-latin chars', () => {
    const slugger = new marked.Slugger();
    expect(slugger.slug('привет')).toBe('привет');
  });

  it('should remove ampersands 857', () => {
    const slugger = new marked.Slugger();
    expect(slugger.slug('This & That Section')).toBe('this--that-section');
  });

  it('should remove periods', () => {
    const slugger = new marked.Slugger();
    expect(slugger.slug('file.txt')).toBe('filetxt');
  });
});

describe('Test paragraph token type', () => {
  it('should use the "paragraph" type on top level', () => {
    const md = 'A Paragraph.\n\n> A blockquote\n\n- list item\n';

    const tokens = marked.lexer(md);

    expect(tokens[0].type).toBe('paragraph');
    expect(tokens[3].type).toBe('paragraph');
    expect(tokens[7].type).toBe('text');
  });
});
