const { withMainApplication } = require('@expo/config-plugins');

const PACKAGE_IMPORT = 'import com.west2online.safeareawebview.SafeAreaWebViewPackage';
const PACKAGE_ADD = 'add(SafeAreaWebViewPackage())';

function withSafeAreaWebView(config) {
  return withMainApplication(config, mainApplicationConfig => {
    let contents = mainApplicationConfig.modResults.contents;

    if (!contents.includes(PACKAGE_IMPORT)) {
      const next = contents.replace(
        'import com.facebook.react.common.assets.ReactFontManager',
        `import com.facebook.react.common.assets.ReactFontManager\n${PACKAGE_IMPORT}`,
      );
      if (next === contents) {
        throw new Error('[safe-area-webview] Failed to inject SafeAreaWebViewPackage import into MainApplication.');
      }
      contents = next;
    }

    if (!contents.includes(PACKAGE_ADD)) {
      const next = contents.replace(
        '// add(MyReactNativePackage())',
        `// add(MyReactNativePackage())\n          ${PACKAGE_ADD}`,
      );
      if (next === contents) {
        throw new Error('[safe-area-webview] Failed to inject SafeAreaWebViewPackage into MainApplication.');
      }
      contents = next;
    }

    mainApplicationConfig.modResults.contents = contents;
    return mainApplicationConfig;
  });
}

module.exports = withSafeAreaWebView;
