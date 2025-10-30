// Test case for issue #2832 - bullet rendering with 4-space indentation
import { marked } from './lib/marked.esm.js';

const testCases = [
  {
    name: 'Empty nested item with 4-space indentation',
    markdown: `- title
    - desc
    -`,
  },
  {
    name: 'Empty nested item with 2-space indentation',
    markdown: `- title
  - desc
  -`,
  },
];

testCases.forEach((testCase) => {
  console.log(`\n=== ${testCase.name} ===`);
  console.log('Input:');
  console.log(JSON.stringify(testCase.markdown));
  console.log('\nOutput:');
  try {
    const result = marked.parse(testCase.markdown);
    console.log(result);
  } catch(error) {
    console.error('Error:', error.message);
  }
});
