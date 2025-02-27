import { FlatCompat } from '@eslint/eslintrc';
import stylistic from '@stylistic/eslint-plugin';
import withNuxt from './.nuxt/eslint.config.mjs';

const eslintrc = new FlatCompat();

export default withNuxt(
  {
    ignores: ['api/**/*.ts', 'api/**/*.js', 'api/**/*.vue'],
  },
  ...eslintrc.extends('plugin:vue-pug/vue3-recommended'),
  {
    files: ['**/*.vue'],
    rules: {
      'vue/require-v-for-key': 'error',
      'vue/no-use-v-if-with-v-for': 'error',
      'vue/multi-word-component-names': 'off',
      'vue/attribute-hyphenation': 'off',
    },
  },
  {
    files: ['**/*.vue', '**/*.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      // '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      '@stylistic/brace-style': 'error',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/explicit-function-return-type': 'error',
    },
  },
  stylistic.configs.customize({
    indent: 2, // インデントはスペース2
    quotes: 'single', // クオートはシングル
    semi: true, // セミコロンは必要
  }),
);
