import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ACCESS_TOKEN_KEY, COURSE_CURRENT_CACHE_KEY, YKT_SYNJONES_AUTH_KEY } from '@/lib/constants';
import { COURSE_TYPE, CUSTOM_TYPE, CourseCache, EXAM_TYPE, getCourseSetting, type CustomCourse } from '@/lib/course';
import { CUSTOM_COURSE_MIGRATION_DONE_KEY } from '@/lib/custom-course-sync';
import locateDate from '@/lib/locate-date';
import { LocalUser } from '@/lib/user';
import UserLogin from '@/lib/user-login';
import { pushToWebViewJWCH } from '@/lib/webview';
import NativeBrightnessModule from '@/modules/native-brightness';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Link, Stack } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

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

  // 设置过期的一卡通 synjones auth
  const setInvalidSynjonesAuth = async () => {
    await AsyncStorage.setItem(
      YKT_SYNJONES_AUTH_KEY,
      'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjowLCJleHAiOjE3MDAxMTA5MjksImlhdCI6MTY5OTUwNjEyOSwiaXNzIjoid2VzdDItb25saW5lIn0.wk108E9cho0wb6dOU_jYQQN1_K0Z_XAh4-mrBzJcgn1nCgsSHJHn8D6RW5T6sDhl1jQdSCrkOeXqb7egFHXMCA',
    );
    toast.success('已经为一卡通设置无效的 Synjones Auth');
  };

  // 判断 Cookie 是否有效
  const isCookieValid = async () => {
    const resp = await LocalUser.checkCredentials();
    toast.info('Cookie 检查结果' + resp);
  };

  const cleanAllCache = async () => {
    const cacheDir = FileSystem.cacheDirectory;
    if (cacheDir === null) return;
    try {
      await FileSystem.deleteAsync(cacheDir, { idempotent: true });
      toast.success('清理缓存目录成功');
    } catch (error) {
      toast.error(`清理缓存目录失败：${error}`);
    }
  };

  const cleanPaperCache = async () => {
    const cacheDir = FileSystem.cacheDirectory;
    if (cacheDir === null) return;
    try {
      await FileSystem.deleteAsync(cacheDir + 'paper/', { idempotent: true });
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

  // 【调试用】造两门"旧版本残留"的自定义课程：只存在设备本地、服务端没有，
  // 用来验证静默迁移（打开课表页 → 自动上传 → 本地被服务端数据覆盖）。
  const seedLegacyCustomCourses = async () => {
    try {
      const setting = await getCourseSetting();
      const now = new Date().toISOString();

      const legacyCourses: CustomCourse[] = [
        {
          id: 9001,
          name: '调试课程1',
          teacher: 'debug',
          location: '西2-404',
          startClass: 5,
          endClass: 6,
          startWeek: 1,
          endWeek: 16,
          weekday: 4,
          single: true,
          double: true,
          adjust: false,
          color: '#7A6068',
          remark: 'debug remark',
          priority: 1,
          storageKey: '9f1c2d3e-4a5b-4c6d-8e7f-0a1b2c3d4e5f',
          lastUpdateTime: now,
          type: CUSTOM_TYPE,
          examType: '',
          semester: setting.selectedSemester,
        },
        {
          id: 9002,
          name: '调试课程2',
          teacher: 'debug',
          location: '东3-306',
          startClass: 7,
          endClass: 8,
          startWeek: 2,
          endWeek: 15,
          weekday: 4,
          single: false,
          double: true,
          adjust: false,
          color: '#5A9DBD',
          remark: 'debug remark',
          priority: 2,
          storageKey: '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
          lastUpdateTime: now,
          type: CUSTOM_TYPE,
          examType: '',
          // 旧数据可能没存学期，故意留空来验证迁移时会回退到当前学期
          semester: '',
        },
      ];

      const raw = await AsyncStorage.getItem(COURSE_CURRENT_CACHE_KEY);
      const cache = raw ? JSON.parse(raw) : {};
      // 自定义课程按「星期几 - 1」分组，周四对应下标 3
      const emptyDays = [0, 1, 2, 4, 5, 6].map(day => [day, []]);
      cache.customData = Object.fromEntries([...emptyDays, [3, legacyCourses]]);
      cache.customDigest = '';

      await AsyncStorage.setItem(COURSE_CURRENT_CACHE_KEY, JSON.stringify(cache));
      // 必须清掉迁移标记，否则 reconcile 会当成本地已经迁移过，直接用服务端数据覆盖
      await AsyncStorage.removeItem(CUSTOM_COURSE_MIGRATION_DONE_KEY);

      toast.success('已写入 2 门本地自定义课程，重启 App 后打开课表页观察迁移');
    } catch (error) {
      toast.error(`写入失败：${error}`);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Developer Tools' }} />

      <PageContainer>
        <KeyboardAwareScrollView className="h-full" keyboardShouldPersistTaps="handled">
          <SafeAreaView edges={['bottom']}>
            {/* 导航相关功能 */}
            <Text className="m-3 my-4 text-lg font-bold">Manager</Text>
            <Link href="/devtools/async-storage-list" asChild>
              <Button>
                <Text>AsyncStorage Manager</Text>
              </Button>
            </Link>
            <Link href="/devtools/react-query-storage-list" asChild>
              <Button>
                <Text>React Query Storage</Text>
              </Button>
            </Link>
            <Link href="/devtools/push-tools" asChild>
              <Button>
                <Text>Push Tools</Text>
              </Button>
            </Link>
            <Link href="/devtools/learning-center-api" asChild>
              <Button>
                <Text>Learning Center API</Text>
              </Button>
            </Link>
            <Link href="/devtools/domitory-repair-api" asChild>
              <Button>
                <Text>Domitory Repair API</Text>
              </Button>
            </Link>
            <Link href="/devtools/webview-tools" asChild>
              <Button>
                <Text>WebView Tools</Text>
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
            <Link href="/devtools/multi-state-test" asChild>
              <Button>
                <Text>Multi State Test</Text>
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
            <Button onPress={setInvalidSynjonesAuth}>
              <Text>Set Invalid Synjones Auth</Text>
            </Button>
            <Button onPress={SetDifferentCourseCacheDigest}>
              <Text>Set Different Course Cache Digest</Text>
            </Button>
            <Button onPress={seedLegacyCustomCourses}>
              <Text>Seed Legacy Custom Courses (2)</Text>
            </Button>
            <Button
              onPress={() => {
                NativeBrightnessModule.enableHighBrightness();
              }}
            >
              <Text>Enable High Brightness</Text>
            </Button>
            <Button
              onPress={() => {
                NativeBrightnessModule.disableHighBrightness();
              }}
            >
              <Text>Disable High Brightness</Text>
            </Button>

            {/* 缓存管理 */}
            <Text className="m-3 my-4 text-lg font-bold">Cache</Text>
            <Link href="/devtools/file-cache" asChild>
              <Button>
                <Text>FileCache Manager</Text>
              </Button>
            </Link>
            <Button onPress={cleanAllCache}>
              <Text>Clean All Cache (File System)</Text>
            </Button>
            <Button onPress={cleanPaperCache}>
              <Text>Clean Paper Cache (File System)</Text>
            </Button>
          </SafeAreaView>
        </KeyboardAwareScrollView>
      </PageContainer>
    </>
  );
}
