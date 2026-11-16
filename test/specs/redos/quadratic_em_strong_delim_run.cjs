module.exports = [
  {
    markdown: '**'.repeat(10000) + 'x',
    html: `<p>${'**'.repeat(10000)}x</p>`,
  },
  {
    markdown: '__'.repeat(10000) + 'x',
    html: `<p>${'__'.repeat(10000)}x</p>`,
  },
  {
    markdown: '*'.repeat(20000) + 'x',
    html: `<p>${'*'.repeat(20000)}x</p>`,
  },
  {
    markdown: '_'.repeat(20000) + 'x',
    html: `<p>${'_'.repeat(20000)}x</p>`,
  },
];
