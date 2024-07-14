import globals from 'globals';
import standardConfig from './eslint-config-standard.js';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['**/lib', '**/*.min.js', '**/public']
  },
  standardConfig,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser
      }
    },

    rules: {
      semi: ['error', 'always'],

      indent: ['error', 2, {
        SwitchCase: 1,

        VariableDeclarator: {
          var: 2
        },

        outerIIFEBody: 0
      }],

      'operator-linebreak': ['error', 'before', {
        overrides: {
          '=': 'after'
        }
      }],

      'space-before-function-paren': ['error', 'never'],
      'no-cond-assign': 'off',
      'no-useless-escape': 'off',
      'one-var': 'off',
      'no-control-regex': 'off',
      'no-prototype-builtins': 'off',
      'no-extra-semi': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-namespace': 'off',

      '@typescript-eslint/no-unused-vars': ['error', {
        args: 'none'
      }]
    }
  }
];
