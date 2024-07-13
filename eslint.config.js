import typescriptEslint from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import standardConfig from './eslint-config-standard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default [
  {
    ignores: ['**/lib', '**/*.min.js', '**/public']
  },
  standardConfig,
  ...compat.extends('plugin:@typescript-eslint/recommended'),
  {
    plugins: {
      '@typescript-eslint': typescriptEslint
    },

    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser
      },

      parser: tsParser
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
