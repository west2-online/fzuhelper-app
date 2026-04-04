// https://docs.expo.dev/guides/using-eslint/
const forbiddenRule = require('./forbidden-rule');

/**
 * 深度比较两个值是否相等
 * @template T
 * @param {T} a
 * @param {T} b
 * @returns {boolean}
 */
function deepEqual(a, b) {
  if (a === b) return true;

  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (let key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}

/**
 * 将目录路径转换为递归 glob：
 * - a/b -> a/b/**\/\*
 * - a/b/ -> a/b/**\/\*
 * - a/b.tsx -> a/b.tsx
 *
 * @param {string} input - 原始路径
 * @returns {string} 转换后的路径
 */
function normalizeToRecursiveGlob(input) {
  const normalized = input.replace(/\/+$/, '');

  const lastSegment = normalized.split('/').pop() || '';
  const looksLikeFile = /\.[^/]+$/.test(lastSegment);

  if (looksLikeFile) {
    return normalized;
  }

  return `${normalized}/**/*`;
}

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
        files: normalizeToRecursiveGlob(allowPath),
        rules: {
          'no-restricted-imports': [
            'error',
            {
              patterns: forbiddenRule
                .filter(rule => !deepEqual(rule, item)) // 排除当前规则，保留其他规则
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
