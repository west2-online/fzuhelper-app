import { Icon } from '@/components/Icon';
import AsyncStorage from '@react-native-async-storage/async-storage';

import CookieManager from '@preeternal/react-native-cookie-manager';
import Geolocation, { GeolocationOptions } from '@react-native-community/geolocation';
import { useHeaderHeight } from '@react-navigation/elements';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter, type UnknownOutputParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, Share, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import type { WebViewNavigation, WebViewOpenWindowEvent } from 'react-native-webview/lib/WebViewTypes';
import { toast } from 'sonner-native';

import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';
import LoginPrompt from '@/components/sso-login-prompt';

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
import { getGeoLocationJS, getScriptByURL } from '@/utils/webview-inject-script';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

export interface WebParams {
  url: string;
  jwch?: boolean;
  sso?: boolean;
  title?: string;
  [key: string]: any;
}

export default function Web() {
  const [canGoBack, setCanGoBack] = useState(false);
  const [webpageTitle, setWebpageTitle] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [cookiesSet, setCookiesSet] = useState(false);
  const [needSSOLogin, setNeedSSOLogin] = useState(false);
  const [injectedScript, setInjectedScript] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const router = useRouter();
  const [pendingScanCallback, setPendingScanCallback] = useState<string>('');

  // 拦截自定义协议跳转
  const handleShouldStartLoadWithRequest = useCallback(
    (request: { url: string }) => {
      const requestUrl = request.url;

      if (requestUrl.startsWith('fzuhelper://native')) {
        console.log('拦截到自定义协议:', requestUrl);

        try {
          const url = new URL(requestUrl);
          const type = url.searchParams.get('type');
          const func = url.searchParams.get('function');

          if (type === 'scan' && func) {
            setPendingScanCallback(func);
            router.push({
              pathname: '/toolbox/learning-center/qr-scanner',
              params: { callback: func },
            });
          }
        } catch (e) {
          console.error('解析协议失败:', e);
        }

        return false;
      }

      return true;
    },
    [router],
  );

  const { url, jwch, sso, title, scanResult, scanCallback } = useLocalSearchParams<WebParams & UnknownOutputParams>();
  const { currentTheme } = useTheme();
  const headerHeight = useHeaderHeight();

  const setCookies = useCallback(async () => {
    if (jwch) {
      await CookieManager.clearAll();

      const cookieValid = await LocalUser.checkCredentials();
      if (!cookieValid) {
        try {
          await LocalUser.login();
        } catch (error) {
          console.error('教务系统登录失败:', error);
          toast.error('登录失败，请稍后再试');
          return;
        }
      }
      const credentials = LocalUser.getCredentials();

      if (!credentials.cookies) {
        toast.error('登录失败，请稍后再试');
        return;
      }

      const separator = url.includes('?') ? '&' : '?';
      setCurrentUrl(`${url}${separator}id=${credentials.identifier}`);

      await Promise.all(
        credentials.cookies
          .split(';')
          .map(c =>
            CookieManager.setFromResponse(
              LocalUser.getUser().type === USER_TYPE_POSTGRADUATE ? YJSY_COOKIES_DOMAIN : JWCH_COOKIES_DOMAIN,
              c,
            ),
          ),
      );
    }

    if (sso) {
      await CookieManager.clearAll();
      const SSOCookie = await AsyncStorage.getItem(SSO_LOGIN_COOKIE_KEY);
      const isSSOLogin = SSOCookie ? await checkCookieSSO({ cookies: SSOCookie }) : false;

      if (isSSOLogin && SSOCookie) {
        await Promise.all(SSOCookie.split(';').map(c => CookieManager.setFromResponse(SSO_LOGIN_COOKIE_DOMAIN, c)));
      } else if (SSOCookie) {
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
        if (cookieLogin) {
          await Promise.all(cookieLogin.split(';').map(c => CookieManager.setFromResponse(SSO_LOGIN_COOKIE_DOMAIN, c)));
          await AsyncStorage.setItem(SSO_LOGIN_COOKIE_KEY, cookieLogin);
        } else {
          toast.error('自动重登失败');
          await AsyncStorage.removeItem(SSO_LOGIN_COOKIE_KEY);
          setNeedSSOLogin(true);
        }
      } else {
        setNeedSSOLogin(true);
      }
    }
    setCookiesSet(true);
  }, [jwch, url, sso]);

  useFocusEffect(
    useCallback(() => {
      setInjectedScript(false);
      setCookiesSet(false);
      setNeedSSOLogin(false);
      setCookies();
    }, [setCookies]),
  );

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
          if (canGoBack) {
            webViewRef.current?.goBack();
            return true;
          }
          return false;
        });

        return () => {
          subscription.remove();
        };
      }
    }, [canGoBack]),
  );

  useEffect(() => {
    if (Platform.OS === 'ios') {
      Geolocation.requestAuthorization();
    }
  }, []);

  // 处理扫码结果回调
  useEffect(() => {
    if (scanResult && scanCallback && webViewRef.current) {
      const jsCode = `
        (function() {
          try {
            if (typeof window['${scanCallback}'] === 'function') {
              window['${scanCallback}']('${scanResult}');
            }
          } catch(e) {
            console.error('回调失败:', e);
          }
        })();
        true;
      `;
      webViewRef.current.injectJavaScript(jsCode);
      console.log('扫码结果已回调:', scanCallback, scanResult);
    }
  }, [scanResult, scanCallback]);

  const handleOpenWindow = useCallback((event: WebViewOpenWindowEvent) => {
    const targetUrl = event.nativeEvent.targetUrl;
    console.log('Opening new window with URL:', targetUrl);

    if (webViewRef.current) {
      setCurrentUrl(targetUrl);
    }
  }, []);

  const handleNavigationStateChange = useCallback(
    (event: WebViewNavigation) => {
      if (!event.loading) {
        setCurrentUrl(event.url);

        if (event.title && !title) {
          setWebpageTitle(event.title);
        }

        webViewRef.current?.injectJavaScript(getScriptByURL(event.url, currentTheme));
        if (Platform.OS === 'ios') {
          webViewRef.current?.injectJavaScript(getGeoLocationJS());
        }

        setTimeout(() => {
          setInjectedScript(true);
        }, 200);
      }
    },
    [title, currentTheme],
  );

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

  const headerRight = useCallback(() => {
    if (jwch || sso) {
      return null;
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

  const renderLoading = useCallback(() => {
    return (
      <View className="absolute h-full w-full flex-1 items-center justify-center bg-background">
        <Loading />
      </View>
    );
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          title: title || webpageTitle,
          headerRight: headerRight,
        }}
      />
      <PageContainer>
        {needSSOLogin ? (
          <LoginPrompt message={`登录统一身份认证平台，访问${title ?? '当前'}服务`} />
        ) : !cookiesSet ? (
          <Loading />
        ) : (
          <SafeAreaView className="h-full w-full bg-background" edges={['bottom']}>
            {cookiesSet && (
              <KeyboardAvoidingView behavior="padding" className="flex-1" keyboardVerticalOffset={headerHeight}>
                <WebView
                  source={{ uri: currentUrl || url || '' }}
                  ref={webViewRef}
                  sharedCookiesEnabled
                  cacheEnabled
                  cacheMode="LOAD_DEFAULT"
                  javaScriptEnabled
                  startInLoadingState={true}
                  renderLoading={renderLoading}
                  onLoadProgress={event => setCanGoBack(event.nativeEvent.canGoBack)}
                  scalesPageToFit
                  renderToHardwareTextureAndroid
                  setDisplayZoomControls={false}
                  setBuiltInZoomControls
                  geolocationEnabled={true}
                  overScrollMode="never"
                  allowsBackForwardNavigationGestures
                  contentMode="mobile"
                  allowsInlineMediaPlayback
                  onOpenWindow={handleOpenWindow}
                  onNavigationStateChange={handleNavigationStateChange}
                  onMessage={handleOnMessage}
                  onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
                  className={injectedScript ? 'flex-1' : 'hidden bg-background'}
                />
              </KeyboardAvoidingView>
            )}
          </SafeAreaView>
        )}
      </PageContainer>
    </>
  );
}
