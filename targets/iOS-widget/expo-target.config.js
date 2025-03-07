/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = config => ({
  type: 'widget',
  // name: 'WhatNextCourse',
  icon: 'https://github.com/expo.png',
  // frameworks: ['SwiftUI'],
  // deploymentTarget: '18.0', // 建议跟随主项目的版本
  // exportJs: true, // 启用 JS 导出
  entitlements: {
    // 和主项目的设置保持一致，这样才能共享数据
    'com.apple.security.application-groups': config.ios.entitlements['com.apple.security.application-groups'],
  },
});
