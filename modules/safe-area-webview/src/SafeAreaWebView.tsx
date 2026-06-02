import { forwardRef } from 'react';
import { Platform, requireNativeComponent, type HostComponent } from 'react-native';
import { WebView, type WebViewProps } from 'react-native-webview';

const FzuSafeAreaWebView = requireNativeComponent('FzuSafeAreaWebView') as HostComponent<any>;

/**
 * 定制Webview，不向网页传入safe-area-inset-*等环境变量，因为我们布局已经保证不会渲染到安全区
 * 目前Android only
 */
export const SafeAreaWebView = forwardRef<WebView, WebViewProps>((props, ref) => {
  if (Platform.OS !== 'android') {
    return <WebView {...props} ref={ref} />;
  }

  return <WebView {...props} ref={ref} nativeConfig={{ ...props.nativeConfig, component: FzuSafeAreaWebView }} />;
});

SafeAreaWebView.displayName = 'SafeAreaWebView';
