import { block, inline, other } from '../src/rules.ts';
import { check } from 'recheck';

interface RegexpObj {
  [k: string]: RegExp | string | ((arg: number) => RegExp | string) | ((arg: string) => RegExp | string) | RegexpObj;
}

async function checkRegexp(obj: RegexpObj, name: string) {
  await Promise.all(Object.keys(obj).map(async(prop: string) => {
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
      switch (recheckObj.status) {
        case 'safe':
          console.log('// safe');
          break;
        case 'vulnerable':
          console.log(`// marked(${recheckObj.attack.pattern}, { pedantic: ${pedantic ? 'true' : 'false'}, gfm: ${gfm ? 'true' : 'false'} });`);
          break;
        default:
          console.log('// error:', recheckObj.error);
          break;
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
