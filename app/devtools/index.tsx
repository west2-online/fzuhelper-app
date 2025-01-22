import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import UserLogin from '@/lib/user-login';
import { Link, Stack } from 'expo-router';
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
        <Button onPress={() => toast('Hello world!')}>
          <Text>show toast</Text>
        </Button>
        <Button onPress={() => toast.success('success')}>
          <Text>show toast (success)</Text>
        </Button>
        <Button onPress={testValidateCodeVerify}>
          <Text>test code verify</Text>
        </Button>
      </ThemedView>
    </>
  );
}
