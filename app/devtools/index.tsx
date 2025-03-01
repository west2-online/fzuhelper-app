import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ACCESS_TOKEN_KEY, YMT_ACCESS_TOKEN_KEY } from '@/lib/constants';
import { COURSE_TYPE, CourseCache, EXAM_TYPE } from '@/lib/course';
import locateDate from '@/lib/locate-date';
import { LocalUser } from '@/lib/user';
import UserLogin from '@/lib/user-login';
import { pushToWebViewJWCH } from '@/lib/webview';
import { checkCookieJWCH } from '@/utils/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Link, Stack } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { toast } from 'sonner-native';

const NAVIGATION_TITLE = 'Developer Tools';

export default function HomePage() {
  const login = new UserLogin();
  const testValidateCodeVerify = async () => {
    try {
      const captchaImage = await login.getCaptcha();
      const captcha = await login.autoVerifyCaptcha(captchaImage);
      toast.success('验证码识别成功，结果为：' + captcha);
    } catch (error) {
      toast.error('验证码识别失败：' + error);
    }
  };

  // 尝试调用 locate-date.ts 中的获取日期函数
  const testLocateDate = async () => {
    try {
      const result = await locateDate();
      toast.success('获取到的日期信息：' + JSON.stringify(result));
    } catch (error) {
      toast.error('获取日期信息失败：' + error);
    }
  };

  // 设置过期的 jwch cookie
  const setExpiredCookie = async () => {
    const credentials = LocalUser.getCredentials();
    // 经过验证，每个 cookie 的后几位都是属于 ASP.NET_SessionId 的，删除后 5 个字母，会直接导致 cookie 过期
    const expiredCookie = credentials.cookies?.slice(0, -5);
    await LocalUser.setCredentials(credentials.identifier, expiredCookie);
    toast.success('已经设置过期的 cookie');
  };

  // 设置过期的服务端（west2-online） access token
  const setExpiredAccessToken = async () => {
    await AsyncStorage.setItem(
      ACCESS_TOKEN_KEY,
      'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjowLCJleHAiOjE3MDAxMTA5MjksImlhdCI6MTY5OTUwNjEyOSwiaXNzIjoid2VzdDItb25saW5lIn0.wk108E9cho0wb6dOU_jYQQN1_K0Z_XAh4-mrBzJcgn1nCgsSHJHn8D6RW5T6sDhl1jQdSCrkOeXqb7egFHXMCA',
    );
    toast.success('已经设置过期的 AccessToken');
  };

  // 设置过期的服务端（一码通） access token
  const setInvalidAccessTokenYmt = async () => {
    await AsyncStorage.setItem(
      YMT_ACCESS_TOKEN_KEY,
      'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjowLCJleHAiOjE3MDAxMTA5MjksImlhdCI6MTY5OTUwNjEyOSwiaXNzIjoid2VzdDItb25saW5lIn0.wk108E9cho0wb6dOU_jYQQN1_K0Z_XAh4-mrBzJcgn1nCgsSHJHn8D6RW5T6sDhl1jQdSCrkOeXqb7egFHXMCA',
    );
    toast.success('已经为一码通设置无效的 AccessToken');
  };

  // 判断 Cookie 是否有效
  const isCookieValid = async () => {
    const resp = await checkCookieJWCH();
    toast.info('Cookie 检查结果' + resp);
  };

  const cleanAllCache = async () => {
    const cacheDir = FileSystem.cacheDirectory;
    if (cacheDir === null) return;
    try {
      await FileSystem.deleteAsync(cacheDir);
      toast.success('清理缓存目录成功');
    } catch (error) {
      toast.error(`清理缓存目录失败：${error}`);
    }
  };

  const cleanPaperCache = async () => {
    const cacheDir = FileSystem.cacheDirectory;
    if (cacheDir === null) return;
    try {
      await FileSystem.deleteAsync(cacheDir + 'paper/');
      toast.success('清理历年卷缓存目录成功');
    } catch (error) {
      toast.error(`清理历年卷缓存目录失败：${error}`);
    }
  };

  const SetDifferentCourseCacheDigest = async () => {
    CourseCache.setDigest(COURSE_TYPE, 'test');
    CourseCache.setDigest(EXAM_TYPE, 'test');
    toast.success('已经设置不同的课程缓存摘要');
  };

  return (
    <>
      <Stack.Screen options={{ title: NAVIGATION_TITLE }} />

      <PageContainer>
        <KeyboardAwareScrollView className="h-full" keyboardShouldPersistTaps="handled">
          {/* 导航相关功能 */}
          <Text className="m-3 my-4 text-lg font-bold">Manager</Text>
          <Link href="/devtools/async-storage-list" asChild>
            <Button>
              <Text>AsyncStorage Manager</Text>
            </Button>
          </Link>
          <Link href="/devtools/push-tools" asChild>
            <Button>
              <Text>Push Tools</Text>
            </Button>
          </Link>

          {/* Toast 示例 */}
          <Text className="m-3 my-4 text-lg font-bold">Toast</Text>
          <Button onPress={() => toast('Hello world!')}>
            <Text>Show Default Toast</Text>
          </Button>
          <Button onPress={() => toast.success('success')}>
            <Text>Show Success Toast</Text>
          </Button>

          {/* 页面跳转 */}
          <Text className="m-3 my-4 text-lg font-bold">Quick Links</Text>
          <Link href="/(guest)/academic-login" asChild>
            <Button>
              <Text>Login Page (No way back)</Text>
            </Button>
          </Link>
          <Button
            onPress={() => {
              pushToWebViewJWCH('https://jwcjwxt2.fzu.edu.cn:81/student/glxk/xqxk/xqxk_cszt.aspx', '(Web 测试) 选课');
            }}
          >
            <Text>Choose Course (web test)</Text>
          </Button>
          <Link href="/+not-found" asChild>
            <Button>
              <Text>Not Found Page</Text>
            </Button>
          </Link>

          {/* 功能测试 */}
          <Text className="m-3 my-4 text-lg font-bold">Shortcut</Text>
          <Button onPress={testLocateDate}>
            <Text>Test Locate Date</Text>
          </Button>
          <Button onPress={testValidateCodeVerify}>
            <Text>Test Code Verify</Text>
          </Button>
          <Button onPress={isCookieValid}>
            <Text>Check Cookie</Text>
          </Button>
          <Button onPress={setExpiredCookie}>
            <Text>Set Expired Cookie</Text>
          </Button>
          <Button onPress={setExpiredAccessToken}>
            <Text>Set Expired AccessToken (west2-online)</Text>
          </Button>
          <Button onPress={setInvalidAccessTokenYmt}>
            <Text>Set Invalid AccessToken (ymt)</Text>
          </Button>
          <Button onPress={SetDifferentCourseCacheDigest}>
            <Text>Set Different Course Cache Digest</Text>
          </Button>

          {/* 缓存清理 */}
          <Text className="m-3 my-4 text-lg font-bold">Cache clean</Text>
          <Button onPress={cleanAllCache}>
            <Text>Clean All Cache (File System)</Text>
          </Button>
          <Button onPress={cleanPaperCache}>
            <Text>Clean Paper Cache (File System)</Text>
          </Button>
        </KeyboardAwareScrollView>
      </PageContainer>
    </>
  );
}
