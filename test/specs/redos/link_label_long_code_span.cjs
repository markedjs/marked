module.exports = [
  {
    // A long code span inside a link label is matched in linear time.
    markdown: '[a `' + 'b'.repeat(2000) + '` c](/long)',
    html: '<p><a href="/long">a <code>' + 'b'.repeat(2000) + '</code> c</a></p>',
  },
  {
    // A short code span followed by a long label tail is matched in linear time.
    markdown: '[a `x` ' + 'q'.repeat(3000) + '](/verylong)',
    html: '<p><a href="/verylong">a <code>x</code> ' + 'q'.repeat(3000) + '</a></p>',
  },
];
