import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Dimensions, PixelRatio } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import ImagePicker from 'react-native-image-crop-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { useTheme } from '@/components/app-theme-provider';
import LabelEntry from '@/components/label-entry';
import LabelSwitch from '@/components/label-switch';
import PageContainer from '@/components/page-container';
import PickerModal from '@/components/picker-modal';
import { useRedirectWithoutHistory } from '@/hooks/useRedirectWithoutHistory';
import ReactNativeBlobUtil from 'react-native-blob-util';

const THEME_OPTIONS: { value: 'light' | 'dark' | 'system'; label: string }[] = [
  { value: 'light', label: '日间模式' },
  { value: 'dark', label: '夜间模式' },
  { value: 'system', label: '跟随系统' },
];

export default function AppearancePage() {
  const [pickerVisible, setPickerVisible] = useState(false);
  const { 
    themeSetting, 
    setThemeSetting, 
    hasCustomBackground, 
    darkenBackground, 
    setBackgroundImage, 
    deleteBackgroundImage, 
    setDarkenBackground 
  } = useTheme();
  const redirect = useRedirectWithoutHistory();

  const selectPicture = useCallback(async () => {
    // 获取屏幕宽高
    const { width, height } = Dimensions.get('screen');
    const scale = PixelRatio.get();
    ImagePicker.openPicker({
      mediaType: 'photo',
    })
      .then(async image => {
        // https://github.com/ivpusic/react-native-image-crop-picker/issues/1367#issuecomment-841350648
        let croppedImage = await ImagePicker.openCropper({
          path: image.path,
          width: width * scale,
          height: height * scale,
          mediaType: 'photo',
        });
        await setDarkenBackground(true); // 默认压暗，用户可以手动关闭
        await setBackgroundImage(croppedImage.path);
        await ReactNativeBlobUtil.fs.unlink(image.path);
        toast.success('设置成功，应用将重启');
        redirect('/(guest)');
      })
      .catch(err => {
        console.log('error', err);
        if (err.code === 'E_PICKER_CANCELLED') {
          return;
        }
        toast.error('设置失败：' + err);
      });
  }, [redirect, setBackgroundImage, setDarkenBackground]);

  const restoreDefault = useCallback(async () => {
    try {
      await deleteBackgroundImage();
      toast.success('恢复默认成功，应用将重启');
      redirect('/(guest)');
    } catch (err) {
      console.log('error', err);
      toast.error('恢复默认失败：' + err);
    }
  }, [redirect, deleteBackgroundImage]);

  return (
    <>
      <Stack.Screen options={{ title: '主题换肤' }} />

      <PageContainer>
        <ScrollView className="flex-1 px-8" contentContainerClassName="pt-6">
          <SafeAreaView edges={['bottom']}>
            <LabelEntry
              leftText={'主题模式'}
              rightText={THEME_OPTIONS.find(option => option.value === themeSetting)?.label}
              onPress={() => setPickerVisible(true)}
            />
            <LabelEntry leftText={'选择壁纸'} onPress={selectPicture} />
            {hasCustomBackground && (
              <>
                <LabelEntry leftText={'恢复默认'} onPress={restoreDefault} />
                <LabelSwitch
                  label="壁纸压暗"
                  value={darkenBackground}
                  onValueChange={async () => {
                    await setDarkenBackground(!darkenBackground);
                    toast.success('设置成功，应用将重启');
                    redirect('/(guest)');
                  }}
                />
              </>
            )}
          </SafeAreaView>
        </ScrollView>
        <PickerModal
          title="主题模式"
          visible={pickerVisible}
          data={THEME_OPTIONS}
          value={themeSetting}
          onClose={() => setPickerVisible(false)}
          onConfirm={async value => {
            setPickerVisible(false);
            await setThemeSetting(value);
            toast.success('设置成功');
          }}
        />
      </PageContainer>
    </>
  );
}
