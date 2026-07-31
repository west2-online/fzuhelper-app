import { forwardRef } from 'react';
import { WebView, type WebViewProps } from 'react-native-webview';

/**
 * The Android implementation injects a custom native WebView. RNOH's WebView
 * does not support nativeConfig, so the Harmony build uses the normal port.
 */
export const SafeAreaWebView = forwardRef<WebView, WebViewProps>((props, ref) => <WebView {...props} ref={ref} />);

SafeAreaWebView.displayName = 'SafeAreaWebView';
