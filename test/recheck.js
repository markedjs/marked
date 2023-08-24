import { inline, block } from '../src/rules.js';
import { check } from 'recheck';

function checkRegexp(obj, name) {
  return Promise.all(Object.keys(obj).map(async(prop) => {
    const item = obj[prop];
    const itemName = `${name}.${prop}`;
    let source = '';
    let flags = '';
    if (item instanceof RegExp) {
      source = item.source;
      flags = item.flags;
    } else if (typeof item === 'string') {
      source = item;
    } else {
      return checkRegexp(item, itemName);
    }
    const gfm = itemName.includes('.gfm.');
    const pedantic = itemName.includes('.pedantic.');
    const recheckObj = await check(source, flags);
    if (recheckObj.status !== 'safe') {
      console.log(`// ${itemName}: /${recheckObj.source}/${recheckObj.flags}`);
      console.log(`// marked(${recheckObj.attack.pattern}, { pedantic: ${pedantic ? 'true' : 'false'}, gfm: ${gfm ? 'true' : 'false'} });`);
    }
  }));
}

console.log(`
import { marked } from './src/marked.js';

const start = Date.now();
`);

await Promise.all([
  checkRegexp(inline, 'inline'),
  checkRegexp(block, 'block')
]);

console.log(`
console.log(Date.now() - start);`);
