// https://docs.expo.dev/guides/using-eslint/
const { forbiddenList } = require('./forbidden-rule.js');

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
      ...forbiddenList.map(item => ({
        name: item.source,
        importNames: item.names,
        message: item.message,
      })),
    ],
  },
};
