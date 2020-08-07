const marked = require('./');

const md = `
<!-- multi
line
comment
-->
`;

console.log(marked(md).replace(/\r/g, '\\r').replace(/\n/g, '\\n'));
