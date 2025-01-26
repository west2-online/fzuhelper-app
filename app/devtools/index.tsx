import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { JWCH_COOKIES_KEY, JWCH_ID_KEY } from '@/lib/constants';
import UserLogin from '@/lib/user-login';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, Stack, router } from 'expo-router';
import { toast } from 'sonner-native';

const NAVIGATION_TITLE = '开发者选项';

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

  return (
    <>
      <Stack.Screen options={{ title: NAVIGATION_TITLE }} />

      <ThemedView>
        <Link href="/(guest)/academic-login" asChild>
          <Button>
            <Text>Push Login Page</Text>
          </Button>
        </Link>
        <Link href="/devtools/async-storage-list" asChild>
          <Button>
            <Text>AsyncStorage List</Text>
          </Button>
        </Link>
        <Link href="/devtools/push-tools" asChild>
          <Button>
            <Text>Push Tools</Text>
          </Button>
        </Link>
        <Button onPress={() => toast('Hello world!')}>
          <Text>Show Default Toast</Text>
        </Button>
        <Button onPress={() => toast.success('success')}>
          <Text>Show Success Toast</Text>
        </Button>
        <Button onPress={testValidateCodeVerify}>
          <Text>Test Code Verify</Text>
        </Button>
        <Button
          onPress={async () => {
            const url =
              'https://jwcjwxt2.fzu.edu.cn:81/pyfa/skjh/TeachingPlan_view.aspx?kkhm=20240102200131001&id=' +
              (await AsyncStorage.getItem(JWCH_ID_KEY));
            const cookie = await AsyncStorage.getItem(JWCH_COOKIES_KEY); // 可选的 cookie
            const title = '自定义标题'; // 可选的 title

            router.push({
              pathname: '/(guest)/web',
              params: { url, cookie, title }, // 传递参数
            });
          }}
        >
          <Text>Test Open TeachingPlan</Text>
        </Button>
      </ThemedView>
    </>
  );
}
