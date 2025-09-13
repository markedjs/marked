import markedEslintConfig from '@markedjs/eslint-config';

export default [
  {
    ignores: ['**/lib', '**/public', 'test.js'],
  },
  ...markedEslintConfig,
];
