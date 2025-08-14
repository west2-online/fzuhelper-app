// https://docs.expo.dev/guides/using-eslint/
const forbiddenRule = require('./forbidden-rule');

module.exports = {
  root: true,
  extends: ['@react-native', 'expo', 'prettier', 'plugin:react/jsx-runtime'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': [
      'warn',
      {
        endOfLine: 'auto',
      },
    ],
    'comma-dangle': [
      'warn',
      {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'only-multiline',
      },
    ],
    'no-restricted-imports': [
      'error',
      ...forbiddenRule.map(item => ({
        name: item.source,
        importNames: item.names,
        message: item.message,
      })),
    ],
  },
  overrides: forbiddenRule
    .filter(item => item.allowIn?.length)
    .map(item => ({
      files: item.allowIn.map(path => (path.endsWith('/') ? path + '**/*' : path + '/**/*')),
      rules: {
        'no-restricted-imports': 'off',
      },
    })),
};
