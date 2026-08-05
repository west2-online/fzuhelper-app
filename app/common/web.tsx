import { Icon } from '@/components/Icon';
import AsyncStorage from '@react-native-async-storage/async-storage';

import CookieManager from '@preeternal/react-native-cookie-manager';
import Geolocation, { GeolocationOptions } from '@react-native-community/geolocation';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter, type UnknownOutputParams } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import type {
  OnShouldStartLoadWithRequest,
  WebViewErrorEvent,
  WebViewNavigation,
  WebViewNavigationEvent,
  WebViewOpenWindowEvent,
  WebViewProgressEvent,
} from 'react-native-webview/lib/WebViewTypes';
import { toast } from 'sonner-native';

import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';
import LoginPrompt from '@/components/sso-login-prompt';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

import { useTheme } from '@/components/app-theme-provider';
import {
  JWCH_COOKIES_DOMAIN,
  SSO_LOGIN_COOKIE_DOMAIN,
  SSO_LOGIN_COOKIE_KEY,
  SSO_LOGIN_USER_KEY,
  YJSY_COOKIES_DOMAIN,
} from '@/lib/constants';
import SSOLogin from '@/lib/sso-login';
import { LocalUser, USER_TYPE_POSTGRADUATE, checkCookieSSO } from '@/lib/user';
import { consumeWebViewCallback } from '@/lib/webview-callback';
import { buildCallbackJS, handleCustomProtocol } from '@/lib/webview-protocols';
import { SafeAreaWebView } from '@/modules/safe-area-webview';
import { getGeoLocationJS, getScriptByURL } from '@/utils/webview-inject-script';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

export interface WebParams {
  url: string; // URL 地址
  jwch?: boolean; // （可选）是否为本科教务系统地址
  sso?: boolean; // （可选）是否为统一身份认证地址
  title?: string; // （可选）固定标题
  [key: string]: any; // 添加字符串索引签名
}

const WEBVIEW_LOAD_TIMEOUT_MS = 30_000;
const WEBVIEW_PROGRESS_FALLBACK_DELAY_MS = 1_000;
const WEBVIEW_REVEAL_DELAY_MS = 200;

type WebViewDisplayState = 'loading' | 'ready' | 'error';

interface CookiePreparationResult {
  needsSSOLogin: boolean;
  sourceUrl: string;
}

interface WebViewErrorViewProps {
  message: string;
  onRetry: () => void;
}

function WebViewErrorView({ message, onRetry }: WebViewErrorViewProps) {
  return (
    <View className="flex-1 items-center justify-center bg-background px-8">
      <Text className="mb-2 text-lg font-semibold">网页加载失败</Text>
      <Text className="mb-5 text-center text-sm text-text-secondary" numberOfLines={4}>
        {message}
      </Text>
      <Button onPress={onRetry}>
        <Text>重试</Text>
      </Button>
    </View>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

async function setCookiesFromHeader(url: string, header: string) {
  const cookies = header
    .split(';')
    .map(cookie => cookie.trim())
    .filter(cookie => cookie.includes('='));

  if (cookies.length === 0) {
    throw new Error('登录凭证中没有可用的 Cookie');
  }

  await Promise.all(cookies.map(cookie => CookieManager.setFromResponse(url, cookie)));
}

// 内嵌的网页浏览器，用于显示网页
// 在 iOS 下，当用户在网页浏览器中点击新的跳转时，会模拟创建一个新的页面，返回时只需要左滑即可
export default function Web() {
  const [canGoBack, setCanGoBack] = useState(false);
  const [webpageTitle, setWebpageTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState(''); // 传递给 WebView 的受控 URL
  const [currentUrl, setCurrentUrl] = useState(''); // WebView 当前实际加载的 URL
  const [cookiesSet, setCookiesSet] = useState(false); // 用于控制 Cookie 设置先于 WebView 加载
  const [needSSOLogin, setNeedSSOLogin] = useState(false); // 是否需要统一身份认证登录（由于进入app默认用户已登录jwch,只需要判断这一个）
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [webViewError, setWebViewError] = useState<string | null>(null);
  const [webViewState, setWebViewState] = useState<WebViewDisplayState>('loading');
  const [webViewKey, setWebViewKey] = useState(0);
  const webViewRef = useRef<WebView>(null);
  const initializedRef = useRef(false); // 是否已完成首次初始化（避免每次 focus 都重置导致 WebView 重新加载）
  const initializationRunRef = useRef(0);
  const completedUrlRef = useRef<string | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { url, jwch, sso, title } = useLocalSearchParams<WebParams & UnknownOutputParams>(); // 读取传递的参数
  const { currentTheme } = useTheme();
  const headerHeight = useHeaderHeight();
  const router = useRouter();

  const clearWebViewTimers = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
    if (progressFallbackRef.current) {
      clearTimeout(progressFallbackRef.current);
      progressFallbackRef.current = null;
    }
    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
  }, []);

  const scheduleLoadTimeout = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    loadTimeoutRef.current = setTimeout(() => {
      loadTimeoutRef.current = null;
      setWebViewError('网页加载超时，请检查网络连接后重试');
      setWebViewState('error');
    }, WEBVIEW_LOAD_TIMEOUT_MS);
  }, []);

  const prepareCookies = useCallback(async (): Promise<CookiePreparationResult> => {
    let nextSourceUrl = url || '';

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
        try {
          await LocalUser.login();
        } catch (error) {
          console.error('教务系统登录失败:', error);
          throw new Error('教务系统登录失败，请稍后再试');
        }
      }
      const credentials = LocalUser.getCredentials();

      if (!credentials.cookies) {
        throw new Error('教务系统登录凭证缺失，请重新登录后再试');
      }

      // 根据 URL 是否已有查询参数来决定连接符
      const separator = url.includes('?') ? '&' : '?';
      nextSourceUrl = `${url}${separator}id=${credentials.identifier}`;

      // 设置 JWCH Cookie
      await setCookiesFromHeader(
        // 依据用户类型置入不同的域名 Cookie
        LocalUser.getUser().type === USER_TYPE_POSTGRADUATE ? YJSY_COOKIES_DOMAIN : JWCH_COOKIES_DOMAIN,
        credentials.cookies,
      );
    }

    // 统一身份认证 Cookie
    if (sso) {
      await CookieManager.clearAll();
      const SSOCookie = await AsyncStorage.getItem(SSO_LOGIN_COOKIE_KEY);
      const isSSOLogin = SSOCookie ? await checkCookieSSO({ cookies: SSOCookie }) : false;

      // 存在ssocookie且cookie有效
      if (isSSOLogin && SSOCookie) {
        await setCookiesFromHeader(SSO_LOGIN_COOKIE_DOMAIN, SSOCookie);
      } else if (SSOCookie) {
        // 存在ssocookie但cookie无效,需要自动重登
        const ssoLogin = new SSOLogin();
        const userData = await AsyncStorage.getItem(SSO_LOGIN_USER_KEY);
        if (!userData) {
          return { needsSSOLogin: true, sourceUrl: nextSourceUrl };
        }
        const { account, password } = JSON.parse(userData);
        const cookieLogin = await ssoLogin.login(account, password).catch(error => {
          console.error('SSO登录获取cookie失败:', error);
          return null;
        });
        // toast.info('登录过期，正在重新登录');
        if (cookieLogin) {
          await setCookiesFromHeader(SSO_LOGIN_COOKIE_DOMAIN, cookieLogin);
          await AsyncStorage.setItem(SSO_LOGIN_COOKIE_KEY, cookieLogin);
        } else {
          // 重登失败，跳转到登录页面
          toast.error('自动重登失败');
          await AsyncStorage.removeItem(SSO_LOGIN_COOKIE_KEY);
          return { needsSSOLogin: true, sourceUrl: nextSourceUrl };
        }
      } else {
        // 不存在ssocookie
        return { needsSSOLogin: true, sourceUrl: nextSourceUrl };
      }
    }

    return { needsSSOLogin: false, sourceUrl: nextSourceUrl };
  }, [jwch, url, sso]);

  const initializeWebView = useCallback(async () => {
    const runId = ++initializationRunRef.current;

    clearWebViewTimers();
    setCookiesSet(false);
    setNeedSSOLogin(false);
    setInitializationError(null);
    setWebViewError(null);
    setWebViewState('loading');
    completedUrlRef.current = null;
    setSourceUrl('');
    setCurrentUrl('');

    try {
      const result = await prepareCookies();
      if (runId !== initializationRunRef.current) return;

      setSourceUrl(result.sourceUrl);
      if (result.needsSSOLogin) {
        setNeedSSOLogin(true);
        return;
      }
      setCookiesSet(true);
    } catch (error) {
      if (runId !== initializationRunRef.current) return;

      console.error('WebView 初始化失败:', error);
      setInitializationError(getErrorMessage(error, '网页初始化失败，请稍后再试'));
    }
  }, [clearWebViewTimers, prepareCookies]);

  // 在页面获得焦点时执行
  useFocusEffect(
    useCallback(() => {
      // 仅首次进入时初始化，从子页面（如扫码页）返回时不重置
      // 否则WebView会被卸载重建，原来window上挂的回调函数会丢失，导致 callback 无法执行
      // -- @renbaoshuo, 20260528
      if (initializedRef.current) return;
      initializedRef.current = true;

      // 执行设置Cookie的逻辑
      initializeWebView();
    }, [initializeWebView]),
  );

  useEffect(() => {
    return () => {
      initializationRunRef.current += 1;
      clearWebViewTimers();
    };
  }, [clearWebViewTimers]);

  useEffect(() => {
    if (!cookiesSet) return;
    scheduleLoadTimeout();

    return clearWebViewTimers;
  }, [clearWebViewTimers, cookiesSet, scheduleLoadTimeout, sourceUrl, webViewKey]);

  // 处理 Android 返回键
  useFocusEffect(
    useCallback(() => {
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
    }, [canGoBack]),
  );

  // iOS 定位权限申请
  useEffect(() => {
    if (Platform.OS === 'ios') {
      Geolocation.requestAuthorization();
    }
  }, []);

  const handleShouldStartLoadWithRequest: OnShouldStartLoadWithRequest = useCallback(
    request => {
      console.log('请求加载 URL:', request.url);
      if (
        handleCustomProtocol(request.url, {
          router,
          injectJS: code => webViewRef.current?.injectJavaScript(code),
        })
      ) {
        return false;
      }
      return true;
    },
    [router],
  );

  const handleOpenWindow = useCallback(
    (event: WebViewOpenWindowEvent) => {
      const targetUrl = event.nativeEvent.targetUrl; // 获取目标 URL
      console.log('Opening new window with URL:', targetUrl);

      // 在当前 WebView 中加载目标 URL
      if (webViewRef.current) {
        clearWebViewTimers();
        setSourceUrl(targetUrl);
        setCurrentUrl(targetUrl);
        setWebViewError(null);
        setWebViewState('loading');
        completedUrlRef.current = null;
      }
    },
    [clearWebViewTimers],
  );

  const handleNavigationStateChange = useCallback(
    (event: WebViewNavigation) => {
      setCanGoBack(event.canGoBack);
      if (event.url) {
        setCurrentUrl(event.url);
      }

      if (event.title && !title) {
        setWebpageTitle(event.title);
      }
    },
    [title],
  );

  const handleLoadStart = useCallback(() => {
    clearWebViewTimers();
    setWebViewError(null);
    setWebViewState('loading');
    completedUrlRef.current = null;
    scheduleLoadTimeout();
  }, [clearWebViewTimers, scheduleLoadTimeout]);

  const completeWebViewLoad = useCallback(
    (loadedUrl: string, loadedTitle?: string) => {
      if (completedUrlRef.current === loadedUrl) return;
      completedUrlRef.current = loadedUrl;

      if (progressFallbackRef.current) {
        clearTimeout(progressFallbackRef.current);
        progressFallbackRef.current = null;
      }
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }

      console.log('页面导航到 URL:', loadedUrl);
      setCurrentUrl(loadedUrl);
      if (loadedTitle && !title) {
        setWebpageTitle(loadedTitle);
      }

      try {
        webViewRef.current?.injectJavaScript(getScriptByURL(loadedUrl, currentTheme));
        if (Platform.OS === 'ios') {
          webViewRef.current?.injectJavaScript(getGeoLocationJS()); // 注入定位设计
          // Android 不需要注入这个代码也可以授权，但是即使定位到了，易班也提示定位失败
          // 基本是易班的问题
        }
      } catch (error) {
        // 页面内容本身已经加载成功，辅助脚本失败不应继续阻塞页面。
        console.warn('WebView 脚本注入失败:', error);
      }

      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
      }
      revealTimeoutRef.current = setTimeout(() => {
        revealTimeoutRef.current = null;
        setWebViewState('ready');
      }, WEBVIEW_REVEAL_DELAY_MS);
    },
    [title, currentTheme],
  );

  const handleLoad = useCallback(
    (event: WebViewNavigationEvent) => {
      completeWebViewLoad(event.nativeEvent.url, event.nativeEvent.title);
    },
    [completeWebViewLoad],
  );

  const handleLoadProgress = useCallback(
    (event: WebViewProgressEvent) => {
      setCanGoBack(event.nativeEvent.canGoBack);
      if (
        event.nativeEvent.progress >= 1 &&
        completedUrlRef.current !== event.nativeEvent.url &&
        !progressFallbackRef.current
      ) {
        const { title: loadedTitle, url: loadedUrl } = event.nativeEvent;
        progressFallbackRef.current = setTimeout(() => {
          progressFallbackRef.current = null;
          completeWebViewLoad(loadedUrl, loadedTitle);
        }, WEBVIEW_PROGRESS_FALLBACK_DELAY_MS);
      }
    },
    [completeWebViewLoad],
  );

  const handleLoadError = useCallback(
    (event: WebViewErrorEvent) => {
      event.preventDefault();
      clearWebViewTimers();
      completedUrlRef.current = null;
      setCurrentUrl(event.nativeEvent.url);
      setWebViewError(event.nativeEvent.description || '网页加载失败，请检查网络连接后重试');
      setWebViewState('error');
    },
    [clearWebViewTimers],
  );

  const retryWebView = useCallback(() => {
    clearWebViewTimers();
    completedUrlRef.current = null;
    setWebViewError(null);
    setWebViewState('loading');
    setWebViewKey(key => key + 1);
  }, [clearWebViewTimers]);

  // 方案参考：https://stackoverflow.com/questions/74347489/how-to-pass-geolocation-permission-to-react-native-webview
  // 实际上在一些需要定位的站点内，请求没有问题，但是易班的签到仍然提示定位失效。
  // 考虑到其他站点没有问题，暂时保留这部分代码。
  const handleOnMessage = useCallback(
    (event: WebViewMessageEvent) => {
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
    },
    [webViewRef],
  );

  // 从 modal 页（如扫码页）返回时，立即向 WebView 注入回调
  useFocusEffect(
    useCallback(() => {
      const callback = consumeWebViewCallback();
      if (!callback) return;
      const { func, args } = callback;
      webViewRef.current?.injectJavaScript(buildCallbackJS(func, args));
      console.log('回调已送webview执行:', func, args);
    }, []),
  );

  const headerRight = useCallback(() => {
    if (jwch || sso) {
      return null; // 权限页面不允许分享
    }
    if (currentUrl) {
      return (
        <Icon
          name="share-outline"
          onPress={() => {
            Share.share({
              message: (title || webpageTitle || '来自福uu的分享') + '\n' + currentUrl,
            });
          }}
        />
      );
    }
  }, [currentUrl, jwch, sso, title, webpageTitle]);

  return (
    <>
      {/* 如果传递了 title 参数，则使用它；否则使用网页标题 */}
      <Stack.Screen
        options={{
          title: title || webpageTitle,
          headerRight: headerRight,
        }}
      />
      <PageContainer>
        {initializationError ? (
          <WebViewErrorView message={initializationError} onRetry={initializeWebView} />
        ) : needSSOLogin ? (
          <LoginPrompt message={`登录统一身份认证平台，访问${title ?? '当前'}服务`} />
        ) : !cookiesSet ? (
          <Loading />
        ) : (
          <SafeAreaView className="h-full w-full bg-background" edges={['bottom']}>
            {cookiesSet && (
              <KeyboardAvoidingView behavior="padding" className="flex-1" keyboardVerticalOffset={headerHeight}>
                <SafeAreaWebView
                  key={webViewKey}
                  source={{ uri: sourceUrl || url || '' }}
                  ref={webViewRef}
                  sharedCookiesEnabled
                  domStorageEnabled
                  cacheEnabled // 启用缓存
                  cacheMode="LOAD_DEFAULT" // 设置缓存模式，LOAD_DEFAULT 表示使用默认缓存策略
                  javaScriptEnabled // 确保启用 JavaScript
                  //
                  // Android 平台设置
                  onLoadProgress={handleLoadProgress}
                  scalesPageToFit // 启用页面缩放
                  renderToHardwareTextureAndroid // 启用硬件加速
                  setDisplayZoomControls={false} // 隐藏缩放控件图标
                  setBuiltInZoomControls // 启用内置缩放控件
                  geolocationEnabled={true} // 启用定位
                  overScrollMode="never" // 禁止过度滚动
                  //
                  // iOS 平台设置
                  allowsBackForwardNavigationGestures // 启用手势返回
                  contentMode="mobile" // 内容模式设置为移动模式，即可自动调整页面大小
                  allowsInlineMediaPlayback // 允许内联播放媒体
                  //
                  // 事件处理
                  onOpenWindow={handleOpenWindow} // 处理新窗口打开事件
                  onNavigationStateChange={handleNavigationStateChange}
                  onLoadStart={handleLoadStart}
                  onLoad={handleLoad}
                  onError={handleLoadError}
                  onMessage={handleOnMessage}
                  onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
                  originWhitelist={['*']}
                  // opacity 不影响原生 WebView 挂载，避免 display:none 阻断鸿蒙加载事件。
                  className="flex-1 bg-background"
                />
                {webViewState === 'loading' && (
                  <View className="absolute h-full w-full items-center justify-center bg-background">
                    <Loading />
                  </View>
                )}
                {webViewState === 'error' && (
                  <View className="absolute h-full w-full bg-background">
                    <WebViewErrorView
                      message={webViewError || '网页加载失败，请检查网络连接后重试'}
                      onRetry={retryWebView}
                    />
                  </View>
                )}
              </KeyboardAvoidingView>
            )}
          </SafeAreaView>
        )}
      </PageContainer>
    </>
  );
}
