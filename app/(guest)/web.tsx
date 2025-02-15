import CookieManager from '@react-native-cookies/cookies';
import { Stack, useLocalSearchParams, type UnknownOutputParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation, WebViewOpenWindowEvent } from 'react-native-webview/lib/WebViewTypes';

import { JWCH_COOKIES_DOMAIN } from '@/lib/constants';

export interface WebParams {
  url: string; // URL 地址
  jwchCookie?: string; // （可选）本科教务系统 Cookie
  title?: string; // （可选）固定标题
}

// 内嵌的网页浏览器，用于显示网页
// 在 iOS 下，当用户在网页浏览器中点击新的跳转时，会模拟创建一个新的页面，返回时只需要左滑即可
export default function Web() {
  const [canGoBack, setCanGoBack] = useState(false);
  const [webpageTitle, setWebpageTitle] = useState('');
  const [currentUrl, setCurrentUrl] = useState(''); // 当前加载的 URL
  const [cookiesSet, setCookiesSet] = useState(false); // 用于控制 Cookie 设置先于 WebView 加载
  const webViewRef = useRef<WebView>(null);
  const { url, jwchCookie, title } = useLocalSearchParams<WebParams & UnknownOutputParams>(); // 读取传递的参数
  const [webviewKey, setWebviewKey] = useState(0); // 用于强制刷新 WebView
  const [isRefreshing, setIsRefreshing] = useState(false); // 控制刷新状态
  const [refreshTriggered, setRefreshTriggered] = useState(false); // 控制是否触发刷新逻辑

  // 处理下拉刷新逻辑
  const handleRefresh = useCallback(() => {
    if (!isRefreshing) {
      // 确保不会重复触发刷新
      setIsRefreshing(true); // 开始刷新
      setRefreshTriggered(true); // 标记刷新已经触发
      setWebviewKey(key => key + 1); // 重新加载 WebView
    }
  }, [isRefreshing]);

  // 当 WebView 完成加载时，停止刷新逻辑
  const handleWebViewLoadEnd = useCallback(() => {
    if (refreshTriggered) {
      setIsRefreshing(false); // 停止刷新
      setRefreshTriggered(false); // 重置触发状态
    }
  }, [refreshTriggered]);

  useEffect(() => {
    const setCookies = async () => {
      if (jwchCookie) {
        await CookieManager.get(JWCH_COOKIES_DOMAIN).then(cookies =>
          Promise.all(
            Object.values(cookies).map(c =>
              CookieManager.set(JWCH_COOKIES_DOMAIN, { ...c, value: 'deleted', expires: '1970-01-01T00:00:00.000Z' }),
            ),
          ),
        );

        await Promise.all(jwchCookie.split(';').map(c => CookieManager.setFromResponse(JWCH_COOKIES_DOMAIN, c)));
      }
      setCookiesSet(true);
    };
    // TODO: 添加研究生Cookie
    setCookies();
  }, [jwchCookie, url, webviewKey]);

  // 处理 Android 返回键
  useEffect(() => {
    if (Platform.OS === 'android') {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (canGoBack) {
          webViewRef.current?.goBack();

          return true; // 阻止默认行为（退出页面）
        }

        return false;
      });

      return () => {
        subscription.remove();
      };
    }
  }, [canGoBack]);

  const handleOpenWindow = useCallback((event: WebViewOpenWindowEvent) => {
    const targetUrl = event.nativeEvent.targetUrl; // 获取目标 URL
    console.log('Opening new window with URL:', targetUrl);

    // 在当前 WebView 中加载目标 URL
    if (webViewRef.current) {
      setCurrentUrl(targetUrl); // 更新当前 URL
    }
  }, []);

  const handleNavigationStateChange = useCallback(
    (event: WebViewNavigation) => {
      if (!event.loading) {
        // 更新当前 URL
        setCurrentUrl(event.url);

        // 更新网页标题
        if (event.title && !title) {
          setWebpageTitle(event.title); // 只有在没有传递 title 参数时才更新标题
        }
      }
    },
    [title],
  );

  return (
    <>
      {/* 如果传递了 title 参数，则使用它；否则使用网页标题 */}
      <Stack.Screen options={{ title: title || webpageTitle }} />
      <SafeAreaView className="h-full w-full" edges={['bottom']}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                if (!isRefreshing) {
                  handleRefresh();
                }
              }}
            />
          } // 下拉刷新控件
        >
          {cookiesSet && (
            <WebView
              source={{ uri: currentUrl || url || '' }} // 使用当前 URL 或传递的 URL
              key={webviewKey} // 强制刷新 WebView
              ref={webViewRef}
              sharedCookiesEnabled
              cacheEnabled // 启用缓存
              cacheMode="LOAD_DEFAULT" // 设置缓存模式，LOAD_DEFAULT 表示使用默认缓存策略
              javaScriptEnabled // 确保启用 JavaScript
              onLoadEnd={handleWebViewLoadEnd} // WebView 加载完成时触发回调
              //
              // Android 平台设置
              onLoadProgress={event => setCanGoBack(event.nativeEvent.canGoBack)} // 更新是否可以返回（Android）
              scalesPageToFit // 启用页面缩放（Android）
              renderToHardwareTextureAndroid // 启用硬件加速（Android）
              setDisplayZoomControls={false} // 隐藏缩放控件图标（Android）
              setBuiltInZoomControls // 启用内置缩放控件（Android）
              //
              // iOS 平台设置
              allowsBackForwardNavigationGestures // 启用手势返回（iOS）
              contentMode="mobile" // 内容模式设置为移动模式，即可自动调整页面大小（iOS）
              allowsInlineMediaPlayback // 允许内联播放媒体（iOS）
              //
              // 事件处理
              onOpenWindow={handleOpenWindow} // 处理新窗口打开事件
              onNavigationStateChange={handleNavigationStateChange}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
