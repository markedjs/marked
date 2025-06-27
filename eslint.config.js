import markedEslintConfig from '@markedjs/eslint-config';

export default [
  {
    ignores: ['**/lib', '**/public'],
  },
  ...markedEslintConfig,
];
