// scratch paper

block.paragraph = (function() {
  var body = [];

  // TOPLEVEL:
  // RULES TO ALLOW IMMEDIATELY
  // FOLLOWING A LINE OF TEXT
  (function push(rule) {
    rule = block[rule].source;
    body.push(rule.replace(/(^|[^\[])\^/g, '$1'));
    return push;
  })
  ('code')
  ('gfm_code')
  ('hr')
  //('heading') //
  //('lheading') //
  ('blockquote')
  //('list') //
  // no list
  ('html');

  body = body.join('|');

  if(0) return new
    RegExp('^[^\\0]+?(?=' + body + '|\\n\\n| *$)');

  return new
    RegExp('^([^\\n]+\\n)+?(?=' + body + '|\\n| *$)|^[^\\n]*$');

  return new
    RegExp('^([^\\n]+\\n(?!'
    + body
    + '))+\\n|^([^\\0](?!\\n(?:'
    + body
    + ')))*$');
})();

// more

block.paragraph = (function() {
  var body = [];

  // TOPLEVEL:
  // RULES TO ALLOW IMMEDIATELY
  // FOLLOWING A LINE OF TEXT
  (function push(rule) {
    rule = block[rule].source;
    body.push(rule.replace(/(^|[^\[])\^/g, '$1'));
    return push;
  })
  ('code')
  ('gfm_code')
  ('hr')
  // no heading
  // no lheading
  ('blockquote')
  // no list
  ('html');

  body = body.join('|');

  if(0) return new
    RegExp('^([^\\n]+(?:\\n(?!' + body + ')|$))+');

  if(0) return new
    RegExp('^([^\\n]+\\n)+?(?!' + body + ')');

  if(0) return new
    RegExp('^([^\\n]+\\n(?!' + body + '))+');

  if(0) return new
    RegExp('^([^\\n]+\\n)+?(?=' + body + '|\\n| *$)|^[^\\n]*$');

  if(0) return new
    RegExp('^([^\\n]+(?:\\n(?!' + body + '))?)+');

  if(0) return new
    RegExp('^([^\\n]+\\n(?!'
    + body
    + '))+\\n|^[^\\0]*?(?!\\n(?:'
    + body
    + '))$');

  return new
    RegExp('^([^\\n]+\\n(?!' + body + '))+\\n*|^[^\\0]*$');

  return new
    RegExp('^([^\\n]+\\n(?!'
    + body
    + '))+\\n|^([^\\0](?!\\n(?:'
    + body
    + ')))*$');
})();

//block.paragraph = /^([^\n]+\n)+\n|^[^\0]+$/;
//block.paragraph = /^([^\n]+\n)+\n|^([^\0]*)$/;
//block.paragraph = /^([^\n]+\n?)+/;

//block.paragraph = /^([^\n]+\n)+\n+|^[^\0]+$/;
// fastest ?? V
//block.paragraph = /^([^\n]+\n)+\n+|^([^\0]*)$/;
//block.paragraph = /^([^\n]+\n?)+\n*/;

// final?

block.paragraph = (function() {
  var body = [];

  // TOPLEVEL:
  // RULES ALLOWED TO IMMEDIATELY
  // FOLLOW A LINE OF TEXT
  (function push(rule) {
    rule = block[rule].source;
    body.push(rule.replace(/(^|[^\[])\^/g, '$1'));
    return push;
  })
  ('code')
  ('gfm_code')
  ('hr')
  // no heading
  // no lheading
  ('blockquote')
  // no list - very important!
  ('html');

  body = body.join('|');

  return new
    RegExp('^([^\\n]+\\n(?!' + body + '))+\\n*|^[^\\0]*$');
})();

//block.paragraph = /^([^\n]+\n)+\n+|^[^\0]+$/;
//block.paragraph = /^([^\n]+\n)+\n+|^([^\0]*)$/;
//block.paragraph = /^([^\n]+\n?)+\n*/;


      // ridiculous fix for markdown's
      // ridiculous top-level list grammar.
      // this will only entail:
      //  hello world
      //  * this is not a list item
      // NOT:
      //  hello world
      //  > this is not a blockquote
      // as opposed to the small `paragraph` rule.

      // item = tokens[tokens.length-2];
      // if (top && l === 1 && item && item.type === 'text') {
      //   tokens[tokens.length-1] = {
      //     type: 'text',
      //     text: cap[0]
      //   };
      //   if (cap[0][cap[0].length-1] === '\n') {
      //     tokens.push({
      //       type: 'space'
      //     });
      //   }
      //   continue;
      // }
