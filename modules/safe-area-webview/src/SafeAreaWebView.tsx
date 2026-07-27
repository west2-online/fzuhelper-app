import { forwardRef } from 'react';
import { Platform, requireNativeComponent, type HostComponent } from 'react-native';
import { WebView, type WebViewProps } from 'react-native-webview';

const FzuSafeAreaWebView =
  Platform.OS === 'android' ? (requireNativeComponent('FzuSafeAreaWebView') as HostComponent<any>) : null;

/**
 * 定制Webview，不向网页传入safe-area-inset-*等环境变量，因为我们布局已经保证不会渲染到安全区
 * Android only, iOS 默认不会传入
 */
export const SafeAreaWebView = forwardRef<WebView, WebViewProps>((props, ref) => {
  if (Platform.OS !== 'android' || !FzuSafeAreaWebView) {
    return <WebView {...props} ref={ref} />;
  }

  return <WebView {...props} ref={ref} nativeConfig={{ ...props.nativeConfig, component: FzuSafeAreaWebView }} />;
});

SafeAreaWebView.displayName = 'SafeAreaWebView';
