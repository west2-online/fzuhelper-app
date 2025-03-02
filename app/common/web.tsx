import CookieManager from '@react-native-cookies/cookies';
import { Stack, useLocalSearchParams, type UnknownOutputParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation, WebViewOpenWindowEvent } from 'react-native-webview/lib/WebViewTypes';

import Loading from '@/components/loading';
import { JWCH_COOKIES_DOMAIN, YJSY_COOKIES_DOMAIN } from '@/lib/constants';
import { LocalUser, USER_TYPE_POSTGRADUATE } from '@/lib/user';
import { toast } from 'sonner-native';

export interface WebParams {
  url: string; // URL 地址
  jwch?: boolean; // （可选）是否为本科教务系统地址
  title?: string; // （可选）固定标题
  [key: string]: any; // 添加字符串索引签名
}

// 内嵌的网页浏览器，用于显示网页
// 在 iOS 下，当用户在网页浏览器中点击新的跳转时，会模拟创建一个新的页面，返回时只需要左滑即可
export default function Web() {
  const [canGoBack, setCanGoBack] = useState(false);
  const [webpageTitle, setWebpageTitle] = useState('');
  const [currentUrl, setCurrentUrl] = useState(''); // 当前加载的 URL
  const [cookiesSet, setCookiesSet] = useState(false); // 用于控制 Cookie 设置先于 WebView 加载
  const webViewRef = useRef<WebView>(null);
  const { url, jwch, title } = useLocalSearchParams<WebParams & UnknownOutputParams>(); // 读取传递的参数

  useEffect(() => {
    const setCookies = async () => {
      if (jwch) {
        // 清除 webview cookies
        // await CookieManager.get(JWCH_COOKIES_DOMAIN).then(cookies =>
        //   Promise.all(
        //     Object.values(cookies).map(c =>
        //       CookieManager.set(JWCH_COOKIES_DOMAIN, { ...c, value: 'deleted', expires: '1970-01-01T00:00:00.000Z' }),
        //     ),
        //   ),
        // );

        // 上面代码在安卓平台有问题，会导致过期 cookie 也被发送
        await CookieManager.clearAll();

        const cookieValid = await LocalUser.checkCredentials();
        if (!cookieValid) {
          // 如果 Cookie 无效，则重新登录
          const userInfo = LocalUser.getUser();
          if (!userInfo.password || !userInfo.userid) {
            toast.error('登录失效，请重新登录');
            return;
          } else {
            await LocalUser.login();
          }
        }
        const credentials = LocalUser.getCredentials();

        if (!credentials.cookies) {
          toast.error('登录失败，请稍后再试');
          return;
        }

        // 根据 URL 是否已有查询参数来决定连接符
        const separator = url.includes('?') ? '&' : '?';
        setCurrentUrl(`${url}${separator}id=${credentials.identifier}`);

        // 设置 JWCH Cookie
        await Promise.all(
          credentials.cookies.split(';').map(c =>
            CookieManager.setFromResponse(
              // 依据用户类型置入不同的域名 Cookie
              LocalUser.getUser().type === USER_TYPE_POSTGRADUATE ? YJSY_COOKIES_DOMAIN : JWCH_COOKIES_DOMAIN,
              c,
            ),
          ),
        );
      }
      setCookiesSet(true);
    };
    setCookies();
  }, [jwch, url]);

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
      {!cookiesSet ? (
        <Loading />
      ) : (
        <SafeAreaView className="h-full w-full" edges={['bottom']}>
          {cookiesSet && (
            <WebView
              source={{ uri: currentUrl || url || '' }} // 使用当前 URL 或传递的 URL
              ref={webViewRef}
              sharedCookiesEnabled
              cacheEnabled // 启用缓存
              cacheMode="LOAD_DEFAULT" // 设置缓存模式，LOAD_DEFAULT 表示使用默认缓存策略
              javaScriptEnabled // 确保启用 JavaScript
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
        </SafeAreaView>
      )}
    </>
  );
}
