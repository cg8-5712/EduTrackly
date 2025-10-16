import globals from 'globals';
import js from '@eslint/js';

export default [
  {
    files: ['**/*.js', '**/*.mjs'],
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      '**/*.test.js'
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      'indent': ['error', 2],
      'linebreak-style': ['error', 'windows'],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always']
    }
  }
];