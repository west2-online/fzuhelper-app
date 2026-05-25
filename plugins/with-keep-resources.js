// expo-quick-actions 只在 Manifest 中保留了 shortcuts.xml, 而没有保留 Icon
// 在 R8 激进的资源压缩策略下将会裁剪掉资源文件，导致二维码快捷方式的图标消失
// 这里显式地将二维码图标写入 Manifest, 确保资源文件不被裁剪

const { withAndroidManifest } = require('@expo/config-plugins');
const ICON_FAMILIES = [
  'qrcode',
  'qrcode_foreground',
  'qrcode_round'
];

module.exports = (config) => withAndroidManifest(config, (mod) => {
  const app = mod.modResults.manifest.application[0];
  app['meta-data'] = app['meta-data'] || [];
  ICON_FAMILIES.forEach(name => {
    app['meta-data'].push({
      $: {
        // 这里的 name 必须唯一，避免冲突
        'android:name': `__keep_${name}_for_shrinker`,
        'android:resource': `@mipmap/${name}`
      }
    });
  });
  return mod;
});