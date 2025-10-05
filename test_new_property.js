import { marked } from './src/marked.ts';

// Test that both property names work
const testExtension = {
  name: 'test',
  level: 'inline',
  start(src) { return src.indexOf('TEST'); },
  tokenizer(src) {
    const match = src.match(/^TEST/);
    if (match) {
      return {
        type: 'test',
        raw: match[0],
        text: 'TESTED'
      };
    }
  },
  renderer(token) {
    return `<span class="test">${token.text}</span>`;
  }
};

// Test old property name (should still work)
console.log('Testing old property name (extensions):');
try {
  marked.use({ extensions: [testExtension] });
  console.log('✓ Old property name works');
  console.log('Result:', marked.parse('This is TEST content'));
} catch (e) {
  console.log('✗ Old property name failed:', e.message);
}

// Reset marked
marked.setOptions(marked.getDefaults());

// Test new property name
console.log('\nTesting new property name (tokenizerAndRendererExtensions):');
try {
  marked.use({ tokenizerAndRendererExtensions: [testExtension] });
  console.log('✓ New property name works');
  console.log('Result:', marked.parse('This is TEST content'));
} catch (e) {
  console.log('✗ New property name failed:', e.message);
}