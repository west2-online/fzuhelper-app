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
      {
        patterns: forbiddenRule.flatMap(item =>
          item.names.map(name => ({
            group: [item.source],
            importNames: [name],
            message: item.message,
          })),
        ),
      },
    ],
  },
  overrides: forbiddenRule
    .filter(item => item.allowIn?.length)
    .flatMap(item =>
      item.allowIn.map(allowPath => ({
        files: allowPath.endsWith('/') ? allowPath + '**/*' : allowPath + '/**/*',
        rules: {
          'no-restricted-imports': [
            'error',
            {
              patterns: forbiddenRule
                .filter(rule => rule !== item) // 排除当前规则，保留其他规则
                .flatMap(rule =>
                  rule.names.map(name => ({
                    group: [rule.source],
                    importNames: [name],
                    message: rule.message,
                  })),
                ),
            },
          ],
        },
      })),
    ),
};
