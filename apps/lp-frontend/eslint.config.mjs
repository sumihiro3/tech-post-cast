import { FlatCompat } from '@eslint/eslintrc';
import stylistic from '@stylistic/eslint-plugin';
import withNuxt from './.nuxt/eslint.config.mjs';

const eslintrc = new FlatCompat();

const stylisticRules = {
  '@stylistic/arrow-parens': 'off',
  '@stylistic/operator-linebreak': ['off'],
  '@stylistic/indent': ['error', 2],
  '@stylistic/quotes': ['error', 'single'],
  '@stylistic/semi': ['error', 'always'],
};

export default withNuxt([
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
      ...stylisticRules,
    },
  },
  {
    files: ['**/*.{vue,ts,js,mjs}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@stylistic/arrow-parens': 'off',
      '@stylistic/operator-linebreak': 'off',
      ...stylisticRules,
    },
  },
  stylistic.configs.customize({
    flat: true,
    indent: 2,
    quotes: 'single',
    semi: true,
    arrowParens: false,
    operatorLinebreak: 'none',
  }),
]);
