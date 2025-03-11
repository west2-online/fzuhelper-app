import { Stack } from 'expo-router';
import { useCallback } from 'react';
import { Dimensions } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import ImagePicker from 'react-native-image-crop-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import LabelEntry from '@/components/label-entry';
import PageContainer from '@/components/page-container';

import { deleteBackgroundImage, hasCustomBackground, setBackgroundImage } from '@/lib/appearance';

export default function AppearancePage() {
  const selectPicture = useCallback(async () => {
    // 获取屏幕宽高
    const { width, height } = Dimensions.get('window');
    ImagePicker.openPicker({
      width: width,
      height: height,
      mediaType: 'photo',
      cropping: true,
    }).then(image => {
      console.log(image.path);
      // move to document directory
      try {
        setBackgroundImage(image.path);
        toast.success('设置成功, 请重启应用');
      } catch (err) {
        console.log('error', err);
        toast.error('设置失败: ' + err);
      }
      return image;
    });
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: '自定义皮肤', headerTransparent: true }} />

      <PageContainer>
        <ScrollView className="flex-1 px-8 pt-8">
          <SafeAreaView edges={['bottom']}>
            <LabelEntry leftText={'选择图片'} onPress={selectPicture} />
            {hasCustomBackground() && <LabelEntry leftText={'恢复默认'} onPress={deleteBackgroundImage} />}
          </SafeAreaView>
        </ScrollView>
      </PageContainer>
    </>
  );
}
