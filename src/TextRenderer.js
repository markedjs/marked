/**
 * TextRenderer
 * returns only the textual part of the token
 */
module.exports = class TextRenderer {
  code(code) {
    return code;
  }

  blockquote(text) {
    return text;
  }

  html() {
    return '';
  }

  heading(text) {
    return text;
  }

  hr() {
    return '';
  }

  list(body) {
    return body;
  }

  listitem(text) {
    return text + '\n';
  }

  checkbox() {
    return '';
  }

  paragraph(text) {
    return text + '\n';
  }

  table() {
    return '';
  }

  tablerow() {
    return '';
  }

  tablecell() {
    return '';
  }

  strong(text) {
    return text;
  }

  em(text) {
    return text;
  }

  codespan(text) {
    return text;
  }

  del(text) {
    return text;
  }

  text(text) {
    return text;
  }

  link(href, title, text) {
    return '' + text;
  }

  image(href, title, text) {
    return '' + text;
  }

  br() {
    return '';
  }

  link(href, title, text) {
    return '' + text;
  }

};
