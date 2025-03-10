import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

interface LoginPromptProps {
  className?: string;
  message?: string;
  buttonText?: string;
  onButtonPress?: () => void;
  isLoading?: boolean; // Optional: To handle loading state externally
}

const LoginPrompt: React.FC<LoginPromptProps> = ({
  className,
  message = '登录统一身份认证平台，享受一码通服务',
  buttonText = '前往登录',
  onButtonPress,
  isLoading = false,
}) => {
  const router = useRouter();

  const handlePress = () => {
    if (onButtonPress) {
      onButtonPress();
    } else {
      router.push('/(guest)/sso-login');
    }
  };

  return (
    <View className={cn('flex-1 items-center justify-center gap-10', className)}>
      <Text className="text-lg">{message}</Text>
      <Button
        onPress={handlePress}
        className="w-1/2"
        disabled={isLoading} // Disable button if loading
      >
        <Text>{buttonText}</Text>
      </Button>

      {/* <Link href="/toolbox/learning-center/webview-login" asChild>
              <Button className="w-1/2">
                <Text className="text-white">网页登录</Text>
              </Button>
            </Link> */}
    </View>
  );
};

export default LoginPrompt;
