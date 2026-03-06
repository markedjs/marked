import { block, inline, other } from '../src/rules.ts';
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
    } else if (typeof item === 'function') {
      // TODO: skip functions for now
      return;
    } else {
      return checkRegexp(item, itemName);
    }
    const gfm = itemName.includes('.gfm.');
    const pedantic = itemName.includes('.pedantic.');
    const recheckObj = await check(source, flags);
    try {
      console.log(`// ${itemName}: /${recheckObj.source}/${recheckObj.flags}`);
      if (recheckObj.status !== 'safe') {
        if (recheckObj?.attack?.pattern) {
          console.log(`// marked(${recheckObj.attack.pattern}, { pedantic: ${pedantic ? 'true' : 'false'}, gfm: ${gfm ? 'true' : 'false'} });`);
        } else {
          console.log('// error:', recheckObj?.error ?? recheckObj);
        }
      } else {
        console.log('// safe');
      }
    } catch(e) {
      console.log(recheckObj);
      throw e;
    }
  }));
}

console.log(`
import { marked } from '../lib/marked.esm.js';

const start = Date.now();
`);

await Promise.all([
  checkRegexp(inline, 'inline'),
  checkRegexp(block, 'block'),
  checkRegexp(other, 'other'),
]);

console.log(`
console.log(Date.now() - start);`);
