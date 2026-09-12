import antfu from '@antfu/eslint-config'
import regexPlugin from 'eslint-plugin-regex'
import autoImportGlobals from './auto-imports-eslint.json' with { type: 'json' }

export default antfu(
  {
    vue: true,
    typescript: true,
    formatters: {
      css: true,
      html: true,
    },
    ignores: [
      'src/plugins/iconify/*.js',
    ],
  },
  {
    name: 'bellucci/auto-import-globals',
    languageOptions: {
      globals: {
        ...autoImportGlobals.globals,
      },
    },
  },
  {
    name: 'bellucci/regex-rules',
    plugins: {
      regex: regexPlugin,
    },
    rules: {
      'regex/invalid': [
        'error',
        [
          {
            regex: '@/assets/images',
            replacement: '@images',
            message: 'Use \'@images\' path alias for image imports',
          },
          {
            regex: '@/assets/styles',
            replacement: '@styles',
            message: 'Use \'@styles\' path alias for importing styles from \'src/assets/styles\'',
          },
          {
            id: 'Disallow icon of icon library',
            regex: 'tabler-\\w',
            message: 'Only \'mdi\' icons are allowed',
          },
          {
            regex: '@core/\\w',
            message: 'You can\'t use @core when you are in @layouts module',
            files: {
              inspect: '@layouts/.*',
            },
          },
          {
            regex: 'useLayouts\\(',
            message: '`useLayouts` composable is only allowed in @layouts & @core directory. Please use `useThemeConfig` composable instead.',
            files: {
              inspect: '^(?!.*(@core|@layouts)).*',
            },
          },
        ],
        'eslint.config.js',
      ],
    },
  },
  {
    name: 'bellucci/custom-rules',
    rules: {
      'no-console': 'warn',
      'no-debugger': 'warn',
      'comma-spacing': ['error', { before: false, after: true }],
      'key-spacing': ['error', { afterColon: true }],
      'n/prefer-global/process': ['off'],
      'vue/first-attribute-linebreak': ['error', { singleline: 'beside', multiline: 'below' }],
      'max-len': 'off',
      'newline-before-return': 'error',
      'lines-around-comment': [
        'error',
        {
          beforeBlockComment: true,
          beforeLineComment: true,
          allowBlockStart: true,
          allowClassStart: true,
          allowObjectStart: true,
          allowArrayStart: true,
          ignorePattern: '!SECTION',
        },
      ],
      'array-element-newline': ['error', 'consistent'],
      'array-bracket-newline': ['error', 'consistent'],
      'vue/multi-word-component-names': 'off',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'vuetify/components',
              message: 'Import from vuetify/lib/components instead',
            },
            {
              name: 'vue3-apexcharts',
              message: 'apexcharts are auto imported',
            },
          ],
        },
      ],
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: 'expression', next: 'const' },
        { blankLine: 'always', prev: 'const', next: 'expression' },
        { blankLine: 'always', prev: 'multiline-const', next: '*' },
        { blankLine: 'always', prev: '*', next: 'multiline-const' },
      ],
      'vue/block-tag-newline': 'error',
      'vue/component-api-style': 'error',
      'vue/component-name-in-template-casing': ['error', 'PascalCase', { registeredComponentsOnly: false, ignores: ['/^swiper-/'] }],
      'vue/custom-event-name-casing': ['error', 'camelCase', {
        ignores: ['/^(click):[a-z]+((\d)|([A-Z0-9][a-z0-9]+))*([A-Z])?/'],
      }],
      'vue/define-macros-order': 'error',
      'vue/html-comment-content-newline': 'error',
      'vue/html-comment-content-spacing': 'error',
      'vue/html-comment-indent': 'error',
      'vue/match-component-file-name': 'error',
      'vue/no-child-content': 'error',
      'vue/require-default-prop': 'off',
      'vue/no-duplicate-attr-inheritance': 'error',
      'vue/no-empty-component-block': 'error',
      'vue/no-multiple-objects-in-class': 'error',
      'vue/no-reserved-component-names': 'error',
      'vue/no-template-target-blank': 'error',
      'vue/no-useless-mustaches': 'error',
      'vue/no-useless-v-bind': 'error',
      'vue/padding-line-between-blocks': 'error',
      'vue/prefer-separate-static-class': 'error',
      'vue/prefer-true-attribute-shorthand': 'error',
      'vue/no-restricted-class': ['error', '/^(p|m)(l|r)-/'],
      'vue/valid-v-slot': ['error', { allowModifiers: true }],
      'vue/no-irregular-whitespace': 'error',
      'vue/template-curly-spacing': 'error',
    },
  },
)
