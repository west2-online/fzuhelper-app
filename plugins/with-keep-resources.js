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