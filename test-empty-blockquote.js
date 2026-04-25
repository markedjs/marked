import { marked } from './lib/marked.esm.js';

// 测试用例
const testCases = [
  '>',           // 纯 >
  '> ',          // > 加空格
  '>\t',         // > 加制表符
  '>\n>',        // 两行空引用
  '> \n> ',      // 两行带空格的空引用
  '> hello',     // 正常引用（应该保留）
];

console.log('=== 测试空引用块解析 ===\n');

for (const test of testCases) {
  console.log(`输入: ${JSON.stringify(test)}`);
  console.log(`输出: ${JSON.stringify(marked(test))}`);
  console.log();
}
