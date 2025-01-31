import CookieManager from '@react-native-cookies/cookies';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

export type WebParams = {
  url: string; // URL 地址
  jwchCookie?: string; // （可选）本科教务系统 Cookie
  title?: string; // （可选）固定标题
};

// 内嵌的网页浏览器，用于显示网页
// 在 iOS 下，当用户在网页浏览器中点击新的跳转时，会模拟创建一个新的页面，返回时只需要左滑即可
export default function Web() {
  const [canGoBack, setCanGoBack] = useState(false);
  const [webpageTitle, setWebpageTitle] = useState('');
  const [currentUrl, setCurrentUrl] = useState(''); // 当前加载的 URL
  const webViewRef = useRef<WebView>(null);

  // 读取传递的参数
  const { url, jwchCookie, title } = useLocalSearchParams<WebParams>();

  const onAndroidBackPress = useCallback(() => {
    if (canGoBack) {
      webViewRef.current?.goBack();
      return true; // 阻止默认行为（退出页面）
    }
    return false;
  }, [canGoBack]);

  useEffect(() => {
    const setCookies = async () => {
      if (jwchCookie) {
        const clearCookie = CookieManager.clearAll(); // 应该只清除教务处 Cookie，但没有这种方法
        const setCookie = jwchCookie
          .split(';')
          .map(c => CookieManager.setFromResponse('https://jwcjwxt2.fzu.edu.cn:81', c)); // 设置 Cookie
        await Promise.all([clearCookie, setCookie]);
      }
      // TODO: 添加研究生Cookie
    };
    setCookies();
  }, [jwchCookie, url]);

  // 处理 Android 返回键
  useEffect(() => {
    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', onAndroidBackPress);
      return () => {
        BackHandler.removeEventListener('hardwareBackPress', onAndroidBackPress);
      };
    }
  }, [onAndroidBackPress]);

  // 处理新窗口打开事件
  const onOpenWindow = (event: { nativeEvent: { targetUrl: any } }) => {
    const targetUrl = event.nativeEvent.targetUrl; // 获取目标 URL
    console.log('Opening new window with URL:', targetUrl);

    // 在当前 WebView 中加载目标 URL
    if (webViewRef.current) {
      setCurrentUrl(targetUrl); // 更新当前 URL
    }
  };

  return (
    <>
      {/* 如果传递了 title 参数，则使用它；否则使用网页标题 */}
      <Stack.Screen options={{ title: title || webpageTitle }} />
      <SafeAreaView className="h-full w-full" edges={['bottom']}>
        <WebView
          source={{ uri: currentUrl || url || '' }} // 使用当前 URL 或传递的 URL
          sharedCookiesEnabled={true}
          allowsBackForwardNavigationGestures={true} // 启用手势返回（iOS）
          ref={webViewRef}
          cacheEnabled={true} // 启用缓存
          cacheMode={'LOAD_DEFAULT'} // 设置缓存模式，LOAD_DEFAULT 表示使用默认缓存策略
          onLoadProgress={event => {
            setCanGoBack(event.nativeEvent.canGoBack);
          }} // 更新是否可以返回（Android）
          javaScriptEnabled={true} // 确保启用 JavaScript
          scalesPageToFit={true} // 启用页面缩放（Android）
          renderToHardwareTextureAndroid={true} // 启用硬件加速（Android）
          setBuiltInZoomControls={true} // 启用内置缩放控件（Android）
          setDisplayZoomControls={false} // 隐藏缩放控件图标
          contentMode="mobile" // 内容模式设置为移动模式，即可自动调整页面大小（iOS）
          allowsInlineMediaPlayback={true} // 允许内联播放媒体（iOS）
          onNavigationStateChange={event => {
            if (!event.loading) {
              // 更新当前 URL
              setCurrentUrl(event.url);

              // 更新网页标题
              if (event.title && !title) {
                setWebpageTitle(event.title); // 只有在没有传递 title 参数时才更新标题
              }
            }
          }}
          onOpenWindow={onOpenWindow} // 处理新窗口打开事件
        />
      </SafeAreaView>
    </>
  );
}
