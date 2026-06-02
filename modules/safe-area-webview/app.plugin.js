const { withMainApplication } = require('@expo/config-plugins');

const PACKAGE_IMPORT = 'import com.west2online.safeareawebview.SafeAreaWebViewPackage';
const PACKAGE_ADD = 'add(SafeAreaWebViewPackage())';

function withSafeAreaWebView(config) {
  return withMainApplication(config, mainApplicationConfig => {
    let contents = mainApplicationConfig.modResults.contents;

    if (!contents.includes(PACKAGE_IMPORT)) {
      contents = contents.replace(
        'import com.facebook.react.common.assets.ReactFontManager',
        `import com.facebook.react.common.assets.ReactFontManager\n${PACKAGE_IMPORT}`,
      );
    }

    if (!contents.includes(PACKAGE_ADD)) {
      contents = contents.replace(
        '// add(MyReactNativePackage())',
        `// add(MyReactNativePackage())\n          ${PACKAGE_ADD}`,
      );
    }

    mainApplicationConfig.modResults.contents = contents;
    return mainApplicationConfig;
  });
}

module.exports = withSafeAreaWebView;
