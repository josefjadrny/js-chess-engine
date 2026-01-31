import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',

      // Root JS/MJS tooling; keep lint focused on TypeScript sources.
      '**/*.js',
      '**/*.mjs',

      // Build type outputs.
      '**/*.d.ts'
    ]
  },

  js.configs.recommended,

  // Standard, widely-used TypeScript rules (syntax-only; no type-aware rules).
  ...tseslint.configs.recommended,

  // Minimal project-level relaxations so lint is usable without a refactor.
  {
    rules: {
      // This codebase intentionally has a few unused helpers/exports.
      '@typescript-eslint/no-unused-vars': 'off',

      // This codebase (and tests) use `any` in a few practical places.
      '@typescript-eslint/no-explicit-any': 'off',

      // Adapter uses require() to avoid bundler/interop issues.
      '@typescript-eslint/no-require-imports': 'off'
    }
  },

  // Disable rules that conflict with Prettier formatting.
  prettier
];
