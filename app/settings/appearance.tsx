import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Dimensions, PixelRatio } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import ImagePicker from 'react-native-image-crop-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import LabelEntry from '@/components/label-entry';
import PageContainer from '@/components/page-container';

import { useRedirectWithoutHistory } from '@/hooks/useRedirectWithoutHistory';
import { deleteBackgroundImage, hasCustomBackground, setBackgroundImage } from '@/lib/appearance';

export default function AppearancePage() {
  const [customBackground, setCustomBackground] = useState(false);
  const redirect = useRedirectWithoutHistory();

  useEffect(() => {
    const checkBackground = async () => {
      const result = await hasCustomBackground();
      setCustomBackground(result);
    };
    checkBackground();
  }, []);

  const selectPicture = useCallback(async () => {
    // 获取屏幕宽高
    const { width, height } = Dimensions.get('screen');
    const scale = PixelRatio.get();
    ImagePicker.openPicker({
      width: width * scale,
      height: height * scale,
      mediaType: 'photo',
      cropping: true,
    }).then(async image => {
      console.log(image.path);
      try {
        await setBackgroundImage(image.path);
        toast.success('设置成功, 应用将重启');
        redirect('/(guest)');
      } catch (err) {
        console.log('error', err);
        toast.error('设置失败: ' + err);
      }
      return image;
    });
  }, [redirect]);

  const restoreDefault = useCallback(async () => {
    try {
      await deleteBackgroundImage();
      toast.success('恢复默认成功, 应用将重启');
      redirect('/(guest)');
    } catch (err) {
      console.log('error', err);
      toast.error('恢复默认失败: ' + err);
    }
  }, [redirect]);

  return (
    <>
      <Stack.Screen options={{ title: '自定义皮肤' }} />

      <PageContainer>
        <ScrollView className="flex-1 px-8 pt-8">
          <SafeAreaView edges={['bottom']}>
            <LabelEntry leftText={'选择图片'} onPress={selectPicture} />
            {customBackground && <LabelEntry leftText={'恢复默认'} onPress={restoreDefault} />}
          </SafeAreaView>
        </ScrollView>
      </PageContainer>
    </>
  );
}
