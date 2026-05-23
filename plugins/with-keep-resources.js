const { withAndroidManifest } = require('@expo/config-plugins');
module.exports = (config) => withAndroidManifest(config, (mod) => {
  const app = mod.modResults.manifest.application[0];
  app['meta-data'] = app['meta-data'] || [];
  app['meta-data'].push({ $: { 'android:name': '__keep_qrcode', 'android:resource': '@mipmap/qrcode' } });
  return mod;
});