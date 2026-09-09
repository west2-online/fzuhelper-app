/**
 * @file forbidden-imports.js
 *
 * Defines project-level imports that should not be used directly.
 *
 * Referenced by `.eslintrc.js` and enforced by ESLint's
 * `no-restricted-imports` rule.
 *
 * @typedef {Object} ForbiddenImportRule
 * @property {string} source Module path, such as 'react-native'.
 * @property {string[]} names Banned named, default, or namespace imports.
 * @property {string} message Error message, preferably with the replacement.
 * @property {string[]=} allowIn Optional file or directory allowlist.
 */

/** @type {ForbiddenImportRule[]} */
module.exports = [
  {
    source: 'react-native',
    names: ['SafeAreaView'],
    message: '此组件仅支持 iOS 且不能配置 edges，请从 react-native-safe-area-context 导入，或使用 useSafeAreaInsets()',
  },
  {
    source: 'react-native',
    names: ['KeyboardAvoidingView'],
    message: '此组件不支持 Android，请从 react-native-keyboard-controller 导入',
  },
  {
    source: 'react-native',
    names: ['Button'],
    message: '此组件不适配主题，请从 @/components/ui/ 导入',
  },
  {
    source: 'react-native',
    names: ['Text'],
    message: '此组件会跟随系统字体大小，请从 @/components/ui/ 导入',
    allowIn: ['components/ui/text.tsx', 'utils/patch-text-component.ts'],
  },
  {
    source: 'react-native',
    names: ['useColorScheme'],
    message: "import { useTheme } from '@/components/app-theme-provider'",
    allowIn: ['components/app-theme-provider.tsx'],
  },
  {
    source: 'nativewind',
    names: ['useColorScheme'],
    message: "import { useTheme } from '@/components/app-theme-provider'",
  },
];
