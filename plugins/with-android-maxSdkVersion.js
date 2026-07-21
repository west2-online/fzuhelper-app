const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withPermissionMaxSdkVersion(config) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults.manifest;

    if (!androidManifest['uses-permission']) {
      androidManifest['uses-permission'] = [];
    }

    const targetPermissions = [
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ];

    androidManifest['uses-permission'].forEach((perm) => {
      const attrs = perm.$ || {};
      const name = attrs['android:name'];
      if (targetPermissions.includes(name)) {
        attrs['android:maxSdkVersion'] = '29';
        attrs['tools:replace'] = 'android:maxSdkVersion';
      }
    });

    return config;
  });
};
