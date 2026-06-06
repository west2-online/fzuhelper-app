const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withMaxSdkVersion(config, props) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults.manifest;

    if (!androidManifest['uses-sdk']) {
      androidManifest['uses-sdk'] = [{ $: {} }];
    } else if (!androidManifest['uses-sdk'][0]['$']) {
      androidManifest['uses-sdk'][0]['$'] = {};
    }

    const sdkAttrs = androidManifest['uses-sdk'][0]['$'];
    sdkAttrs['android:maxSdkVersion'] = props.maxSdkVersion.toString();
    sdkAttrs['tools:replace'] = 'android:maxSdkVersion';

    return config;
  });
};
