import { forwardRef } from 'react';
import { Platform, requireNativeComponent, type HostComponent } from 'react-native';
import { WebView, type WebViewProps } from 'react-native-webview';

/**
 * 定制Webview，不向网页传入safe-area-inset-*等环境变量，因为我们布局已经保证不会渲染到安全区
 * Android only, iOS 默认不会传入
 */
export const SafeAreaWebView = forwardRef<WebView, WebViewProps>((props, ref) => {
  if (Platform.OS !== 'android') {
    return <WebView {...props} ref={ref} />;
  }

  const FzuSafeAreaWebView = requireNativeComponent('FzuSafeAreaWebView') as HostComponent<any>;

  return <WebView {...props} ref={ref} nativeConfig={{ ...props.nativeConfig, component: FzuSafeAreaWebView }} />;
});

SafeAreaWebView.displayName = 'SafeAreaWebView';
