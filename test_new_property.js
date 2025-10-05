import { marked } from './src/marked.ts';

// Test the backtick precedence fix
console.log('Testing backtick precedence fix:');

const testCases = [
  {
    input: '**text `**` more**',
    expected: '<strong>text <code>**</code> more</strong>',
    description: 'Single backticks with emphasis - code takes precedence'
  },
  {
    input: '**text ``**`` more**',
    expected: '<strong>text <code>**</code> more</strong>',
    description: 'Double backticks with emphasis - code takes precedence'
  },
  {
    input: '**text ```**``` more**',
    expected: '<strong>text <code>**</code> more</strong>',
    description: 'Triple backticks with emphasis - code takes precedence'
  },
  {
    input: '**text ````**```` more**',
    expected: '<strong>text <code>**</code> more</strong>',
    description: 'Quadruple backticks with emphasis - code takes precedence'
  },
  {
    input: '__text ``__`` more__',
    expected: '<strong>text <code>__</code> more</strong>',
    description: 'Double backticks with underscore emphasis'
  },
  {
    input: '`**not bold**`',
    expected: '<code>**not bold**</code>',
    description: 'Code spans should prevent emphasis processing'
  },
  {
    input: '**start `code` end**',
    expected: '<strong>start <code>code</code> end</strong>',
    description: 'Code within emphasis should work'
  }
];

testCases.forEach(({ input, expected, description }) => {
  try {
    const result = marked.parseInline(input);
    const passed = result === expected;
    console.log(`${passed ? '✓' : '✗'} ${description}`);
    if (!passed) {
      console.log(`  Input:    ${input}`);
      console.log(`  Expected: ${expected}`);
      console.log(`  Got:      ${result}`);
    }
  } catch (e) {
    console.log(`✗ ${description} - Error: ${e.message}`);
  }
});

// Test that normal cases still work
console.log('\nTesting regression cases:');

const regressionCases = [
  {
    input: '**bold text**',
    expected: '<strong>bold text</strong>',
    description: 'Normal emphasis should still work'
  },
  {
    input: '`code`',
    expected: '<code>code</code>',
    description: 'Normal code should still work'
  },
  {
    input: '**bold** and `code`',
    expected: '<strong>bold</strong> and <code>code</code>',
    description: 'Separate emphasis and code should work'
  }
];

regressionCases.forEach(({ input, expected, description }) => {
  try {
    const result = marked.parseInline(input);
    const passed = result === expected;
    console.log(`${passed ? '✓' : '✗'} ${description}`);
    if (!passed) {
      console.log(`  Input:    ${input}`);
      console.log(`  Expected: ${expected}`);
      console.log(`  Got:      ${result}`);
    }
  } catch (e) {
    console.log(`✗ ${description} - Error: ${e.message}`);
  }
});