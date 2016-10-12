
const tableMd = `
Header 1 | Header 2
--       | ---
Cell 1   | Cell 2
Cell 3   | Cell 4

Header 1|Header 2|Header 3|Header 4
:---    |:--:    |--:     |---
Cell 1  |Cell 2  |Cell 3  |Cell 4
*Cell 5*|Cell 6  |Cell 7  |Cell 8

`;

const marked = require('../../lib/marked');
const Renderer = marked.Renderer;

class MyRenderer extends Renderer {

    table(header, body) {
        return super.table(header, body);
    }

    tablerow(content) {
        return super.tablerow(content);
    }

    tablecell(content, flags) {
        return super.tablecell(content, flags);
    }

}

marked.setOptions({
    tableWidth: true,
    renderer: new MyRenderer
});

console.log(marked(tableMd));
