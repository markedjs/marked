import { block, inline, other } from '../src/rules.ts';
import { check } from 'recheck';

interface RegexpObj {
  [k: string]: RegExp | string | ((arg: number) => RegExp | string) | ((arg: string) => RegExp | string) | RegexpObj;
}

async function checkRegexp(obj: RegexpObj, name: string, showSafe = false) {
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
      return checkRegexp(item, itemName, showSafe);
    }
    const gfm = itemName.includes('.gfm.');
    const pedantic = itemName.includes('.pedantic.');
    const recheckObj = await check(source, flags);
    try {
      const regExp = `// ${itemName}: /${recheckObj.source}/${recheckObj.flags}`;
      switch (recheckObj.status) {
        case 'safe':
          if (showSafe) {
            console.log(regExp);
            console.log('// safe');
          }
          break;
        case 'vulnerable':
          console.log(regExp);
          console.log(`// marked(${recheckObj.attack.pattern}, { pedantic: ${pedantic ? 'true' : 'false'}, gfm: ${gfm ? 'true' : 'false'} });`);
          break;
        default:
          console.log(regExp);
          console.log('// error:', recheckObj.error);
          break;
      }
    } catch(e) {
      console.log(recheckObj);
      throw e;
    }
  }));
}

async function main() {
  const allRules: RegexpObj = {
    inline,
    block,
    other,
  };

  const rawArgs = process.argv.slice(2);
  const showSafe = rawArgs.includes('--safe');
  const args = rawArgs.filter(arg => arg !== '--safe');
  let checks: Promise<void>[] = [];

  if (args.length > 0) {
    for (const arg of args) {
      const parts = arg.split('.');
      let current: RegexpObj[string] | undefined = allRules;
      for (const part of parts) {
        if (current && typeof current === 'object' && !(current instanceof RegExp) && part in current) {
          current = (current as RegexpObj)[part];
        } else {
          current = undefined;
          break;
        }
      }

      if (current === undefined) {
        console.error(`Rule not found: ${arg}`);
        continue;
      }

      if (current instanceof RegExp || typeof current === 'string') {
        const lastDot = arg.lastIndexOf('.');
        const parentName = lastDot === -1 ? '' : arg.slice(0, lastDot);
        const prop = lastDot === -1 ? arg : arg.slice(lastDot + 1);
        checks.push(checkRegexp({ [prop]: current }, parentName, showSafe));
      } else if (typeof current === 'object' && current !== null) {
        checks.push(checkRegexp(current as RegexpObj, arg, showSafe));
      }
    }
  } else {
    checks = [
      checkRegexp(inline, 'inline', showSafe),
      checkRegexp(block, 'block', showSafe),
      checkRegexp(other, 'other', showSafe),
    ];
  }

  console.log(`
import { marked } from '../lib/marked.esm.js';

const start = Date.now();
`);

  await Promise.all(checks);

  console.log(`
console.log(Date.now() - start);`);
}

await main();
