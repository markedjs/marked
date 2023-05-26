import fs from 'fs';
import path from 'path';
import fm from 'front-matter';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function node4Polyfills() {
  // https://github.com/uxitten/polyfill/blob/master/string.polyfill.js
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padEnd
  if (!String.prototype.padEnd) {
    // eslint-disable-next-line no-extend-native
    String.prototype.padEnd = function padEnd(targetLength, padString) {
      targetLength = targetLength >> 0; // floor if number or convert non-number to 0;
      padString = String((typeof padString !== 'undefined' ? padString : ' '));
      if (this.length > targetLength) {
        return String(this);
      } else {
        targetLength = targetLength - this.length;
        if (targetLength > padString.length) {
          padString += padString.repeat(targetLength / padString.length); // append to original to ensure we are longer than needed
        }
        return String(this) + padString.slice(0, targetLength);
      }
    };
  }

  // https://github.com/uxitten/polyfill/blob/master/string.polyfill.js
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
  if (!String.prototype.padStart) {
    // eslint-disable-next-line no-extend-native
    String.prototype.padStart = function padStart(targetLength, padString) {
      targetLength = targetLength >> 0; // truncate if number, or convert non-number to 0;
      padString = String(typeof padString !== 'undefined' ? padString : ' ');
      if (this.length >= targetLength) {
        return String(this);
      } else {
        targetLength = targetLength - this.length;
        if (targetLength > padString.length) {
          padString += padString.repeat(targetLength / padString.length); // append to original to ensure we are longer than needed
        }
        return padString.slice(0, targetLength) + String(this);
      }
    };
  }
}
node4Polyfills();

export function outputCompletionTable(title, specs) {
  let longestName = 0;
  let maxSpecs = 0;

  for (const section in specs) {
    longestName = Math.max(section.length, longestName);
    maxSpecs = Math.max(specs[section].total, maxSpecs);
  }

  const maxSpecsLen = ('' + maxSpecs).length;
  const spaces = maxSpecsLen * 2 + longestName + 11;

  console.log('-'.padEnd(spaces + 4, '-'));
  console.log(`| ${title.padStart(Math.ceil((spaces + title.length) / 2)).padEnd(spaces)} |`);
  console.log(`| ${' '.padEnd(spaces)} |`);
  for (const section in specs) {
    console.log(`| ${section.padEnd(longestName)} ${('' + specs[section].pass).padStart(maxSpecsLen)} of ${('' + specs[section].total).padStart(maxSpecsLen)} ${(100 * specs[section].pass / specs[section].total).toFixed().padStart(4)}% |`);
  }
  console.log('-'.padEnd(spaces + 4, '-'));
  console.log();
}

export function loadFiles(dir) {
  const files = fs.readdirSync(dir);

  return files.reduce((obj, file) => {
    const ext = path.extname(file);
    const name = path.basename(file, ext);
    const absFile = path.join(dir, file);
    let specs;

    switch (ext) {
      case '.md': {
        const content = fm(fs.readFileSync(absFile, 'utf8'));
        const skip = content.attributes.skip;
        delete content.attributes.skip;
        const only = content.attributes.only;
        delete content.attributes.only;
        specs = [{
          section: name,
          markdown: content.body,
          html: fs.readFileSync(absFile.replace(/[^.]+$/, 'html'), 'utf8'),
          options: content.attributes,
          only,
          skip
        }];
        break;
      }
      case '.cjs':
      case '.json': {
        try {
          specs = require(absFile);
        } catch (err) {
          console.log(`Error loading ${absFile}`);
          throw err;
        }
        if (!Array.isArray(specs)) {
          specs = [specs];
        }
        break;
      }
      default:
        return obj;
    }

    for (let i = 0; i < specs.length; i++) {
      const spec = specs[i];
      if (!spec.section) {
        spec.section = `${name}[${i}]`;
      }
      if (!obj[spec.section]) {
        obj[spec.section] = {
          total: 0,
          pass: 0,
          specs: []
        };
      }

      obj[spec.section].total++;
      obj[spec.section].pass += spec.shouldFail ? 0 : 1;
      obj[spec.section].specs.push(spec);
    }

    return obj;
  }, {});
}
