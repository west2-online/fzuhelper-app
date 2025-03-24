import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation, { GeolocationOptions } from '@react-native-community/geolocation';
import CookieManager from '@react-native-cookies/cookies';
import { Stack, useFocusEffect, useLocalSearchParams, type UnknownOutputParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import type { WebViewNavigation, WebViewOpenWindowEvent } from 'react-native-webview/lib/WebViewTypes';
import { toast } from 'sonner-native';

import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';
import LoginPrompt from '@/components/sso-login-prompt';

import {
  JWCH_COOKIES_DOMAIN,
  SSO_LOGIN_COOKIE_DOMAIN,
  SSO_LOGIN_COOKIE_KEY,
  SSO_LOGIN_USER_KEY,
  YJSY_COOKIES_DOMAIN,
} from '@/lib/constants';
import SSOLogin from '@/lib/sso-login';
import { LocalUser, USER_TYPE_POSTGRADUATE, checkCookieSSO } from '@/lib/user';
import { getGeoLocationJS, getScriptByURL } from '@/utils/webview-inject-script';

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
  const [needSSOLogin, setNeedSSOLogin] = useState(false); // 是否需要统一身份认证登录（由于进入app默认用户已登录jwch,只需要判断这一个）
  const [injectedScript, setInjectedScript] = useState(false); // 用于控制注入脚本先于 WebView 加载
  const webViewRef = useRef<WebView>(null);
  const { url, jwch, sso, title } = useLocalSearchParams<WebParams & UnknownOutputParams>(); // 读取传递的参数
  const colorScheme = useColorScheme();

  const setCookies = useCallback(async () => {
    // 教务系统 Cookie
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

    // 统一身份认证 Cookie
    if (sso) {
      await CookieManager.clearAll();
      const SSOCookie = await AsyncStorage.getItem(SSO_LOGIN_COOKIE_KEY);
      const isSSOLogin = SSOCookie ? await checkCookieSSO({ cookies: SSOCookie }) : false;

      // 存在ssocookie且cookie有效
      if (isSSOLogin && SSOCookie) {
        SSOCookie.split(';').map(c => CookieManager.setFromResponse(SSO_LOGIN_COOKIE_DOMAIN, c));
      } else if (SSOCookie) {
        // 存在ssocookie但cookie无效,需要自动重登
        const ssoLogin = new SSOLogin();
        const userData = await AsyncStorage.getItem(SSO_LOGIN_USER_KEY);
        if (!userData) {
          setNeedSSOLogin(true);
          return;
        }
        const { account, password } = JSON.parse(userData);
        const cookieLogin = await ssoLogin.login(account, password).catch(error => {
          console.error('SSO登录获取cookie失败:', error);
          return null;
        });
        toast.info('登录已过期,正在尝试重新登录');
        if (cookieLogin) {
          cookieLogin.split(';').map(c => CookieManager.setFromResponse(SSO_LOGIN_COOKIE_DOMAIN, c));
          await AsyncStorage.setItem(SSO_LOGIN_COOKIE_KEY, cookieLogin);
        } else {
          // 重登失败，跳转到登录页面
          toast.error('自动重登失败');
          await AsyncStorage.removeItem(SSO_LOGIN_COOKIE_KEY);
          setNeedSSOLogin(true);
        }
      } else {
        // 不存在ssocookie
        setNeedSSOLogin(true);
      }
    }
    setCookiesSet(true);
  }, [jwch, url, sso]);

  // 在页面获得焦点时执行
  useFocusEffect(
    useCallback(() => {
      // 重置状态，准备重新加载
      setInjectedScript(false);
      setCookiesSet(false);
      setNeedSSOLogin(false);

      // 执行设置Cookie的逻辑
      setCookies();
    }, [setCookies]),
  );

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
    } else if (Platform.OS === 'ios') {
      Geolocation.requestAuthorization();
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

        webViewRef.current?.injectJavaScript(getScriptByURL(event.url, colorScheme));
        if (Platform.OS === 'ios') {
          webViewRef.current?.injectJavaScript(getGeoLocationJS()); // 注入定位设计
          // Android 不需要注入这个代码也可以授权，但是即使定位到了，易班也提示定位失败
          // 基本是易班的问题
        }

        setTimeout(() => {
          setInjectedScript(true);
        }, 200);
      }
    },
    [title, colorScheme],
  );

  // 方案参考：https://stackoverflow.com/questions/74347489/how-to-pass-geolocation-permission-to-react-native-webview
  // 实际上在一些需要定位的站点内，请求没有问题，但是易班的签到仍然提示定位失效。
  // 考虑到其他站点没有问题，暂时保留这部分代码。
  const handleOnMessage = (event: WebViewMessageEvent) => {
    let data: { event?: string; options?: GeolocationOptions; watchID?: number } = {};
    try {
      data = JSON.parse(event.nativeEvent.data);
    } catch (err: any) {
      console.error('Failed to parse message:', err);
      return;
    }

    if (data?.event && data.event === 'getCurrentPosition') {
      Geolocation.getCurrentPosition(
        position => {
          webViewRef.current!.postMessage(JSON.stringify({ event: 'currentPosition', data: position }));
        },
        error => {
          webViewRef.current!.postMessage(JSON.stringify({ event: 'currentPositionError', data: error }));
        },
        data.options,
      );
    } else if (data?.event && data.event === 'watchPosition') {
      Geolocation.watchPosition(
        position => {
          webViewRef.current!.postMessage(JSON.stringify({ event: 'watchPosition', data: position }));
        },
        error => {
          webViewRef.current!.postMessage(JSON.stringify({ event: 'watchPositionError', data: error }));
        },
        data.options,
      );
    } else if (data?.event && data.event === 'clearWatch') {
      Geolocation.clearWatch(data.watchID ?? 0);
    }
  };

  // 如果传入sso且需要sso登录，则跳转到sso登录页面
  if (needSSOLogin) {
    return (
      <>
        <LoginPrompt message={`登录统一身份认证平台，访问${title ?? '当前'}服务`} />
      </>
    );
  }

  return (
    <>
      {/* 如果传递了 title 参数，则使用它；否则使用网页标题 */}
      <Stack.Screen options={{ title: title || webpageTitle }} />
      <PageContainer>
        {!cookiesSet ? (
          <Loading />
        ) : (
          <SafeAreaView className="h-full w-full bg-background" edges={['bottom']}>
            {cookiesSet && (
              <WebView
                source={{ uri: currentUrl || url || '' }} // 使用当前 URL 或传递的 URL
                ref={webViewRef}
                sharedCookiesEnabled
                cacheEnabled // 启用缓存
                cacheMode="LOAD_DEFAULT" // 设置缓存模式，LOAD_DEFAULT 表示使用默认缓存策略
                javaScriptEnabled // 确保启用 JavaScript
                startInLoadingState={true} // 启用加载状态
                //
                // Android 平台设置
                onLoadProgress={event => setCanGoBack(event.nativeEvent.canGoBack)} // 更新是否可以返回（Android）
                scalesPageToFit // 启用页面缩放（Android）
                renderToHardwareTextureAndroid // 启用硬件加速（Android）
                setDisplayZoomControls={false} // 隐藏缩放控件图标（Android）
                setBuiltInZoomControls // 启用内置缩放控件（Android）
                geolocationEnabled={true} // 启用定位（Android）
                //
                // iOS 平台设置
                allowsBackForwardNavigationGestures // 启用手势返回（iOS）
                contentMode="mobile" // 内容模式设置为移动模式，即可自动调整页面大小（iOS）
                allowsInlineMediaPlayback // 允许内联播放媒体（iOS）
                //
                // 事件处理
                onOpenWindow={handleOpenWindow} // 处理新窗口打开事件
                onNavigationStateChange={handleNavigationStateChange}
                onMessage={handleOnMessage}
                // 当脚本未注入完成时隐藏 WebView
                className={injectedScript ? 'flex-1' : 'hidden bg-background'}
              />
            )}
          </SafeAreaView>
        )}
      </PageContainer>
    </>
  );
}
