import regexp from '../src/rules.js';
import { test, responses } from 'vuln-regex-detector';

const promises = [];
function findRegexps(name, obj) {
  if (typeof obj === 'string') {
    promises.push(testRegexp(name, obj));
  } if (obj instanceof RegExp || obj.exec) {
    if (obj.source) {
      promises.push(testRegexp(name, obj.source));
    }
  } else if (typeof obj === 'object') {
    for (const prop in obj) {
      findRegexps(name + (name ? '.' : '') + prop, obj[prop]);
    }
  }
}

async function testRegexp(name, source) {
  try {
    const result = await test(source);

    if (result === responses.safe) {
      console.log(`${name} is safe`);
      return true;
    } else if (result === responses.vulnerable) {
      console.error(`${name} is vulnerable`);
    } else {
      console.error(`${name} might be vulnerable: ` + result.toString());
    }
  } catch (ex) {
    console.error(`${name} failed with error: ` + ex.toString());
  }
  return false;
}

findRegexps('', regexp);
// promises.push(testRegexp('a', /(a+)+$/.source));
Promise.allSettled(promises).then(results => {
  const code = results.every(r => r.value) ? 0 : 1;
  process.exit(code);
});
