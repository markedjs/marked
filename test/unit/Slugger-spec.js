import { Slugger } from '../../src/Slugger.js';

describe('Test slugger functionality', () => {
  it('should use lowercase slug', () => {
    const slugger = new Slugger();
    expect(slugger.slug('Test')).toBe('test');
  });

  it('should be unique to avoid collisions 1280', () => {
    const slugger = new Slugger();
    expect(slugger.slug('test')).toBe('test');
    expect(slugger.slug('test')).toBe('test-1');
    expect(slugger.slug('test')).toBe('test-2');
  });

  it('should be unique when slug ends with number', () => {
    const slugger = new Slugger();
    expect(slugger.slug('test 1')).toBe('test-1');
    expect(slugger.slug('test')).toBe('test');
    expect(slugger.slug('test')).toBe('test-2');
  });

  it('should be unique when slug ends with hyphen number', () => {
    const slugger = new Slugger();
    expect(slugger.slug('foo')).toBe('foo');
    expect(slugger.slug('foo')).toBe('foo-1');
    expect(slugger.slug('foo 1')).toBe('foo-1-1');
    expect(slugger.slug('foo-1')).toBe('foo-1-2');
    expect(slugger.slug('foo')).toBe('foo-2');
  });

  it('should allow non-latin chars', () => {
    const slugger = new Slugger();
    expect(slugger.slug('привет')).toBe('привет');
  });

  it('should remove ampersands 857', () => {
    const slugger = new Slugger();
    expect(slugger.slug('This & That Section')).toBe('this--that-section');
  });

  it('should remove periods', () => {
    const slugger = new Slugger();
    expect(slugger.slug('file.txt')).toBe('filetxt');
  });

  it('should remove html tags', () => {
    const slugger = new Slugger();
    expect(slugger.slug('<em>html</em>')).toBe('html');
  });

  it('should not increment seen when using dryrun option', () => {
    const slugger = new Slugger();
    expect(slugger.slug('<h1>This Section</h1>', { dryrun: true })).toBe('this-section');
    expect(slugger.slug('<h1>This Section</h1>')).toBe('this-section');
  });

  it('should still return the next unique id when using dryrun', () => {
    const slugger = new Slugger();
    expect(slugger.slug('<h1>This Section</h1>')).toBe('this-section');
    expect(slugger.slug('<h1>This Section</h1>', { dryrun: true })).toBe('this-section-1');
  });

  it('should be repeatable in a sequence', () => {
    const slugger = new Slugger();
    expect(slugger.slug('foo')).toBe('foo');
    expect(slugger.slug('foo')).toBe('foo-1');
    expect(slugger.slug('foo')).toBe('foo-2');
    expect(slugger.slug('foo', { dryrun: true })).toBe('foo-3');
    expect(slugger.slug('foo', { dryrun: true })).toBe('foo-3');
    expect(slugger.slug('foo')).toBe('foo-3');
    expect(slugger.slug('foo')).toBe('foo-4');
  });
});
