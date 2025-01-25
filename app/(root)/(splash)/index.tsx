import { Text } from '@/components/ui/text';
import { IS_PRIVACY_POLICY_AGREED } from '@/lib/constants';
import ExpoUmengModule from '@/modules/umeng-bridge';
import { isAccountExist } from '@/utils/is-account-exist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, BackHandler, Image, Platform, View } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { TouchableOpacity } from 'react-native-gesture-handler';

export default function SplashScreen() {
  const router = useRouter();
  const [shouldShowPrivacyAgree, setShouldShowPrivacyAgree] = useState(true);
  const [showSplashImage, setShowSplashImage] = useState(false);
  const [hideSystemBars, setHideSystemBars] = useState(true);
  const [img, setImg] = useState('https://screen.launch.w2fzu.com/pictures/4abe6f8166c849ec8f18f71d97ff23f2');
  const [countdown, setCountdown] = useState(3);

  // 合规初始化第三方库
  const initThirdParty = useCallback(() => {
    console.log('initThirdParty');
    ExpoUmengModule.initUmeng();
  }, []);

  // 拉取Splash并展示
  const getSplash = useCallback(() => {
    console.log('getSplash');
    // const timer = setTimeout(() => {
    //   router.replace('/(tabs)');
    // }, 3000);
    // router.replace('/(tabs)');
    setShowSplashImage(true);
  }, [router]);

  // 检查登录状态
  const checkLoginStatus = useCallback(async () => {
    console.log('checkLoginStatus');
    if (!(await isAccountExist())) {
      // 未登录，跳转登录页
      router.replace('/(guest)/academic-login');
      return;
    }
    getSplash();
  }, [getSplash, router]);

  const onPrivacyAgree = useCallback(async () => {
    setShouldShowPrivacyAgree(false);
    initThirdParty();
    checkLoginStatus();
  }, [initThirdParty, checkLoginStatus]);

  const checkAndShowPrivacyAgree = useCallback(async () => {
    console.log('checkAndShowPrivacyAgree');
    const privacyAgree = await AsyncStorage.getItem(IS_PRIVACY_POLICY_AGREED);
    if (privacyAgree) {
      onPrivacyAgree();
      return;
    }
    // TODO：里面两份文件要可点击，Alert实现不了，要换掉
    Alert.alert(
      '欢迎',
      '感谢您选择使用福uu！我们非常重视对您的个人信息保护，在使用福uu为您提供的服务之前，请您务必审慎阅读、充分理解以下协议：\n《福uu用户服务协议》\n《福uu隐私政策》\n如您同意，请点击“同意并继续”，开始您的福uu体验之旅。',
      [
        {
          text: Platform.OS === 'ios' ? '不同意' : '不同意并退出',
          onPress: () => {
            // 返回到主界面，App实际上还存活，仅适用于安卓
            BackHandler.exitApp();
          },
        },
        {
          text: '同意并继续',
          onPress: async () => {
            await AsyncStorage.setItem(IS_PRIVACY_POLICY_AGREED, 'true');
            onPrivacyAgree();
          },
        },
      ],
    );
  }, [onPrivacyAgree]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        if (!shouldShowPrivacyAgree) {
          console.log('shouldShowPrivacyAgree false, remove listener');
          subscription.remove();
          return;
        }
        checkAndShowPrivacyAgree();
      }
    };

    checkAndShowPrivacyAgree();
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [checkAndShowPrivacyAgree, shouldShowPrivacyAgree]);

  const navigateToHome = useCallback(() => {
    setHideSystemBars(false);
    // 延迟使得系统栏恢复显示
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 1);
  }, [router]);

  useEffect(() => {
    if (showSplashImage) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev === 1) {
            clearInterval(timer);
            navigateToHome();
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [showSplashImage, navigateToHome]);

  return (
    <>
      <View>
        {!showSplashImage ? (
          // 默认开屏
          <Image
            className="h-full w-full"
            source={require('@/assets/images/splash.png')}
            fadeDuration={0}
            resizeMode="cover"
          />
        ) : (
          <View className="flex h-full flex-col">
            {/* Splash内容 */}
            <View className="mb-10 flex-1">
              {/* Image 占据全部空间 */}
              <Image className="h-full w-full" src={img} resizeMode="cover" />

              {/* TouchableOpacity 放置在 Image 的下方 */}
              <TouchableOpacity>
                <View className="mx-auto -mt-28 mb-10 h-auto w-1/2 flex-1 items-center justify-center rounded-full bg-black/60">
                  <Text className="text-white">点击查看相关内容</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* 底部logo和跳过 */}
            <View className="flex flex-row items-center justify-center pb-11">
              {/* 居中 Image */}
              <View className="flex-1 items-center">
                <Image className="h-10" source={require('@/assets/images/splash_logo.png')} resizeMode="contain" />
              </View>

              {/* 跳过按钮靠右 */}
              <View className="absolute bottom-11 right-8">
                <TouchableOpacity onPress={navigateToHome}>
                  <Text className="rounded-full border-gray-400 bg-gray-200 px-6 py-2">跳过 {countdown}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <SystemBars hidden={hideSystemBars} />
          </View>
        )}
      </View>
    </>
  );
}
