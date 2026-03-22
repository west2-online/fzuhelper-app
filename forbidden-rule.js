/**

* @file forbidden-rule.js
*
* 此文件用于定义项目中**禁止使用的模块、组件或函数**，避免误用导致的问题。
*
* * 在 `.eslintrc.js` 和 `babel.config.js` 中引用
* * 命中规则将导致 ESLint 报错，且可能阻止编译
* * 如确需使用：
* * 可添加 `eslint-disable` 注释
* * 或通过 `allowIn` 配置白名单路径
*
* ---
*
* @typedef {Object} ForbiddenRule
* @property {string} source
* 模块路径（如 'react-native'）
*
* @property {string[]} names
* 禁用的导出名列表：
* * 为空数组表示禁止整个模块
* * 非空表示只禁止指定导出
*
* @property {string} message
* ESLint 报错提示信息（建议写清替代方案）
*
* @property {string[]=} allowIn
* 白名单路径（可选）：
* * 支持文件路径或目录路径
* * 目录建议以 `/` 结尾
* * 仅在这些路径下允许使用该规则中的内容
    */

/** @type {ForbiddenRule[]} */
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
    message: '此组件不适配主题，请从 @/components/ui/ 导入',
    allowIn: ['components/ui/text.tsx'],
  },
];
