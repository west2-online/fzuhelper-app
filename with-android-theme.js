// https://github.com/expo/expo/issues/19563#issuecomment-1990897138
// 对res/styles进行处理，调整主题色和删除多余属性
import configPlugins from '@expo/config-plugins';
const { withAndroidStyles, withAndroidColors } = configPlugins;

function withCustomAppTheme(config) {
  config = withAndroidStyles(config, androidStylesConfig => {
    const styles = androidStylesConfig.modResults;
    styles.resources.style.map(style => {
      if (style.$.name === 'AppTheme') {
        // 输入框光标色
        style.item.push({
          $: { name: 'colorAccent' },
          _: '@color/colorAccent',
        });
      }
    });

    return androidStylesConfig;
  });

  config = withAndroidColors(config, androidColorsConfig => {
    const colors = androidColorsConfig.modResults;
    colors.resources.color.map(color => {
      if (color.$.name === 'colorPrimary' || color.$.name === 'colorPrimaryDark') {
        color._ = '#3498D8';
      }
    });
    colors.resources.color.push({
      $: { name: 'colorAccent' },
      _: '#1089FF',
    });
    return androidColorsConfig;
  });

  return config;
}

export default withCustomAppTheme;
