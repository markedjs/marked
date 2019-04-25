'use strict';

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

function outputCompletionTable(title, specs, longestName, maxSpecs) {
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

function runSpecs(title, file, options) {
  options = options || {};
  const json = require(file);
  let longestName = 0;
  let maxSpecs = 0;
  const specs = json.reduce((obj, spec) => {
    if (!obj[spec.section]) {
      longestName = Math.max(spec.section.length, longestName);
      obj[spec.section] = {
        specs: [],
        pass: 0,
        total: 0
      };
    }
    obj[spec.section].total++;
    maxSpecs = Math.max(obj[spec.section].total, maxSpecs);
    if (!spec.shouldFail) {
      obj[spec.section].pass++;
    }
    obj[spec.section].specs.push(spec);
    return obj;
  }, {});

  outputCompletionTable(title, specs, longestName, maxSpecs);

  describe(title, () => {
    Object.keys(specs).forEach(section => {
      describe(section, () => {
        specs[section].specs.forEach((spec) => {
          spec.options = Object.assign({}, options, (spec.options || {}));
          (spec.only ? fit : it)('should ' + (spec.shouldFail ? 'fail' : 'pass') + ' example ' + spec.example, () => {
            if (spec.shouldFail) {
              expect(spec).not.toRender(spec.html);
            } else {
              expect(spec).toRender(spec.html);
            }
          });
        });
      });
    });
  });
};

node4Polyfills();

runSpecs('GFM 0.29', './gfm/gfm.0.29.json', {gfm: true});
runSpecs('CommonMark 0.29', './commonmark/commonmark.0.29.json', {headerIds: false});
