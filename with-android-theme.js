// https://github.com/expo/expo/issues/19563#issuecomment-1990897138
// 对res/styles进行处理，调整主题色和删除多余属性
const { withAndroidStyles, withAndroidColors } = require('expo/config-plugins');

function withCustomAppTheme(config) {
  config = withAndroidStyles(config, androidStylesConfig => {
    const styles = androidStylesConfig.modResults;
    styles.resources.style.map(style => {
      if (style.$.name === 'AppTheme') {
        // 删掉这两个多余属性，影响AlertDialog样式
        style.item = style.item.filter(
          item => item.$.name !== 'android:textColor' && item.$.name !== 'android:editTextStyle',
        );
        // 输入框光标色
        style.item.push({
          $: { name: 'colorAccent' },
          _: '@color/colorAccent',
        });
      } else if (style.$.name === 'ResetEditText') {
        // 多余style
        styles.resources.style.splice(styles.resources.style.indexOf(style), 1);
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

module.exports = withCustomAppTheme;
