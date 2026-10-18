import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import astro from 'eslint-plugin-astro';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import path from 'node:path';
import ts from 'typescript-eslint';

export default defineConfig(
  includeIgnoreFile(path.resolve(import.meta.dirname, '.gitignore')),
  { ignores: ['**/.astro/', 'pnpm-lock.yaml'] },
  js.configs.recommended,
  ts.configs.recommended,
  svelte.configs.recommended,
  astro.configs.recommended,
  prettier,
  svelte.configs.prettier,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      // TypeScript checks undefined names itself; see typescript-eslint's FAQ.
      'no-undef': 'off',
    },
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: {
      parserOptions: { projectService: true, extraFileExtensions: ['.svelte'], parser: ts.parser },
    },
  },
  {
    files: ['apps/web/src/sw/**'],
    languageOptions: { globals: { ...globals.serviceworker } },
  },
);
