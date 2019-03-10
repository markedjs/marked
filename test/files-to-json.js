const path = require('path');
const fs = require('fs');
const fm = require('front-matter');

const folder = process.argv[2];
const jsonFile = process.argv[3];
const useFiles = process.argv.includes('--files');

if (!folder || !jsonFile) {
  console.log('node ./files-to-json.js {path to folder} {path to json file} [--files]');
  process.exit(1);
}

function titleCase(str) {
  return str.toLowerCase().split('_').map(function(word) {
    return (word.charAt(0).toUpperCase() + word.slice(1));
  }).join(' ');
}

const specs = [];

const files = fs.readdirSync(folder).reduce((obj, file) => {
  const section = titleCase(file.replace(/\.(md|html)$/, ''));
  if (!obj[section]) {
    obj[section] = {};
  }
  if (useFiles) {
    obj[section].file = path.posix.relative(path.posix.dirname(jsonFile), path.posix.join(folder, file)).replace(/\.\w+$/, '');
  } else {
    if (file.match(/\.md$/)) {
      const content = fm(fs.readFileSync(path.resolve(folder, file), 'utf8'));
      obj[section].md = content.body;
      if (Object.keys(content.attributes).length > 0) {
        obj[section].options = content.attributes;
      }
    } else {
      obj[section].html = fs.readFileSync(path.resolve(folder, file), 'utf8');
    }
  }
  return obj;
}, {});

let count = 1;
for (const section in files) {
  const spec = {
    section,
    example: count++
  };

  if (files[section].file) {
    spec.file = files[section].file;
  } else {
    spec.markdown = files[section].md;
    spec.html = files[section].html;
  }

  if (files[section].options) {
    spec.options = files[section].options;
  }

  specs.push(spec);
}

fs.writeFileSync(jsonFile, JSON.stringify(specs, null, 2));
