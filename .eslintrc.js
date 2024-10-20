// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  root: true,
  extends: ['@react-native', 'expo', 'prettier', 'plugin:react/jsx-runtime'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'warn',
    'react-native/no-inline-styles': 0,
  },
};
