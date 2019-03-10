const path = require('path');
const fs = require('fs');

const folder = process.argv[2];
const jsonFile = process.argv[3];

if (!folder || !jsonFile) {
  console.log('node ./json-to-files.js {path to folder} {path to json file}');
  process.exit(1);
}

const specs = require(jsonFile);

const files = specs.reduce((obj, spec) => {
  if (!obj[spec.section]) {
    obj[spec.section] = {
      md: [],
      html: [],
      options: {}
    };
  }

  obj[spec.section].md.push(spec.markdown);
  obj[spec.section].html.push(spec.html);
  Object.assign(obj[spec.section].options, spec.options);

  return obj;
}, {});

try {
  fs.mkdirSync(folder, {recursive: true});
} catch (ex) {
  // already exists
}

for (const section in files) {
  const file = files[section];
  const name = section.toLowerCase().replace(' ', '_');
  const frontMatter = Object.keys(file.options).map(opt => {
    let value = file.options[opt];
    if (typeof value !== 'string') {
      value = JSON.stringify(value);
    }
    return `${opt}: ${value}`;
  }).join('\n');

  let markdown = file.md.join('\n\n');
  if (frontMatter) {
    markdown = `---\n${frontMatter}\n---\n\n${markdown}`;
  }
  const html = file.html.join('\n\n');

  const mdFile = path.resolve(folder, `${name}.md`);
  const htmlFile = path.resolve(folder, `${name}.html`);

  if (fs.existsSync(mdFile) || fs.existsSync(htmlFile)) {
    throw new Error(`${name} already exists.`);
  }

  fs.writeFileSync(mdFile, markdown);
  fs.writeFileSync(htmlFile, html);
}
