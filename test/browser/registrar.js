const marked = require('../../lib/marked.js');
const fs = require('fs');

marked.register({
  block: {
    rule: /^\$\$\n([\s\S\n]+?)\$\$\n/gm,
    type: "math_token",
    tokenize: function(cap) {
      return {
        type: "math_token",
        text: cap[1].replace(/\n/, '')
      }
    }
  },
  inline: {
    rule: /^\${1}([\s\S]+?)\$/,
    text: '\\$'
  },
  render: function(cap){
    if(cap.type){ // block render
      return "<span>"+cap.text+"</span>";

    } else { // inline render
      return "<span>"+cap[1]+"</span>";

    }
  }
});

var md = marked(fs.readFileSync(__dirname + "/registrar.md").toString());

var testOut = "<span>1 over 2</span><p>inline <span>1 over 2</span></p>\n";

console.log(md);
console.log(md == testOut);
