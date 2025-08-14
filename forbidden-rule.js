/**
 * 此文件规范开发中禁止使用的组件和函数等，避免误用产生的问题
 * 在 .eslintrc.js 和 babel.config.js 中引用
 *
 * 配置规则说明如下：
 * interface ForbiddenRule {
 *   source: string; // 模块路径
 *   names: string[]; // 禁用的具体导出名（空数组表示整个模块）
 *   message: string; // 报错信息
 *   allowIn?: string[]; // 白名单路径（可选，字符串数组，支持局部匹配）
 * }
 */

module.exports = [
  {
    source: 'react-native',
    names: ['SafeAreaView'],
    message: '此组件仅支持 iOS 且不能配置 edges，请从 react-native-safe-area-context 导入',
  },
  {
    source: 'react-native',
    names: ['KeyboardAvoidingView'],
    message: '此组件不支持 Android，请从 react-native-keyboard-controller 导入',
  },
  {
    source: 'react-native',
    names: ['Text'],
    message: '此组件不适配主题，请从 @/components/ui/text 导入',
  },
];
