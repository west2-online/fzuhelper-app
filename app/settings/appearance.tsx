import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Dimensions, PixelRatio } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import ImagePicker from 'react-native-image-crop-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import LabelEntry from '@/components/label-entry';
import PageContainer from '@/components/page-container';

import LabelSwitch from '@/components/label-switch';
import PickerModal from '@/components/picker-modal';
import { useRedirectWithoutHistory } from '@/hooks/useRedirectWithoutHistory';
import {
  deleteBackgroundImage,
  getColorScheme,
  getDarkenBackground,
  hasCustomBackground,
  setBackgroundImage,
  setColorScheme,
  setDarkenBackground,
} from '@/lib/appearance';
import ReactNativeBlobUtil from 'react-native-blob-util';

const THEME_OPTIONS: { value: 'light' | 'dark' | 'system'; label: string }[] = [
  { value: 'light', label: '日间模式' },
  { value: 'dark', label: '夜间模式' },
  { value: 'system', label: '跟随系统' },
];

export default function AppearancePage() {
  const [customBackground, setCustomBackground] = useState(false);
  const [darkenBackground, setIsDarkenBackground] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const redirect = useRedirectWithoutHistory();

  useEffect(() => {
    const checkBackground = async () => {
      const result = await hasCustomBackground();
      setCustomBackground(result);
      const darken = await getDarkenBackground();
      setIsDarkenBackground(darken);
    };
    checkBackground();
  }, []);

  useEffect(() => {
    const initTheme = async () => {
      const storedTheme = await getColorScheme();
      console.log('storedTheme', storedTheme);
      setTheme(storedTheme);
    };
    initTheme();
  }, []);

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
        console.log(image.path);
        await setDarkenBackground(true); // 默认压暗，用户可以手动关闭
        await setBackgroundImage(croppedImage.path);
        await ReactNativeBlobUtil.fs.unlink(image.path);
        toast.success('设置成功，应用将重启');
        redirect('/(guest)');
        return image;
      })
      .catch(err => {
        console.log('error', err);
        toast.error('设置失败：' + err);
      });
  }, [redirect]);

  const restoreDefault = useCallback(async () => {
    try {
      await deleteBackgroundImage();
      toast.success('恢复默认成功，应用将重启');
      redirect('/(guest)');
    } catch (err) {
      console.log('error', err);
      toast.error('恢复默认失败：' + err);
    }
  }, [redirect]);

  return (
    <>
      <Stack.Screen options={{ title: '主题换肤' }} />

      <PageContainer>
        <ScrollView className="flex-1 px-8 pt-6">
          <SafeAreaView edges={['bottom']}>
            <LabelEntry
              leftText={'主题模式'}
              rightText={THEME_OPTIONS.find(option => option.value === theme)?.label}
              onPress={() => setPickerVisible(true)}
            />
            <LabelEntry leftText={'选择壁纸'} onPress={selectPicture} />
            {customBackground && (
              <>
                <LabelEntry leftText={'恢复默认'} onPress={restoreDefault} />
                <LabelSwitch
                  label="壁纸压暗"
                  value={darkenBackground}
                  onValueChange={async () => {
                    await setDarkenBackground(!darkenBackground);
                    setIsDarkenBackground(!darkenBackground);
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
          value={theme}
          onClose={() => setPickerVisible(false)}
          onConfirm={async value => {
            setTheme(value);
            await setColorScheme(value);
            Alert.alert('需要重启', '设置成功，请手动重启应用以更新主题');
            setPickerVisible(false);
          }}
        />
      </PageContainer>
    </>
  );
}
