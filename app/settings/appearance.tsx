import { Stack } from 'expo-router';
import { useCallback } from 'react';

import PageContainer from '@/components/page-container';
import { SafeAreaView } from 'react-native-safe-area-context';

import LabelEntry from '@/components/label-entry';
import { deleteBackgroundImage, getBackgroundImagePath, hasCustomBackground } from '@/lib/appearance';
import * as FileSystem from 'expo-file-system';
import { Dimensions } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { ScrollView } from 'react-native-gesture-handler';
import ImagePicker from 'react-native-image-crop-picker';
import { toast } from 'sonner-native';

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
        ReactNativeBlobUtil.fs
          .mv(image.path, getBackgroundImagePath())
          .then(() => {
            toast.success('设置成功，重启应用生效');
            console.log('move success');
          })
          .catch(err => {
            toast.success('设置失败: ' + err);
            console.log('move error', err);
          });
      } catch (err) {
        console.log('error', err);
      }
      return image;
    });
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: '自定义皮肤' }} />

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
