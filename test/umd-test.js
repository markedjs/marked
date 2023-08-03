import '../lib/marked.umd.js';

if (!marked.parse("# test").includes("<h1")) {
  throw new Error("Invalid markdown");
}
