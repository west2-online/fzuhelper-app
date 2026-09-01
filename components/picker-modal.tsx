import WheelPicker from '@quidone/react-native-wheel-picker';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import IcCancel from '@/assets/images/misc/ic_cancel.svg';
import IcConfirm from '@/assets/images/misc/ic_confirm.svg';
import { Text } from '@/components/ui/text';
import { toast } from 'sonner-native';
import { useTheme } from './app-theme-provider';

interface PickerModalProps<T> {
  visible: boolean;
  title: string;
  data: { value: T; label: string }[];
  value: T;
  onClose: () => void;
  onConfirm: (value: T) => void;
}

export default function PickerModal<T>({ visible, title, data, value, onClose, onConfirm }: PickerModalProps<T>) {
  const [tempValue, setTempValue] = useState(value);
  const [pickerKey, setPickerKey] = useState(0);
  const { isDarkTheme } = useTheme();
  const itemTextStyle = useMemo(() => ({ color: isDarkTheme ? 'white' : 'black' }), [isDarkTheme]);

  const HEIGHT = 310; // 预估总高度
  const DURATION = 250; // 动画时长
  const slideAnim = useSharedValue(HEIGHT);
  const fadeAnim = useSharedValue(0);
  // 避免动画卡顿，callback将在动画结束后调用
  const handleAnimation = useCallback(
    (isEnter: boolean, callback?: () => void) => {
      fadeAnim.value = withTiming(isEnter ? 1 : 0, { duration: DURATION });
      slideAnim.value = withTiming(
        isEnter ? 0 : HEIGHT,
        { duration: DURATION, easing: Easing.inOut(Easing.quad) },
        () => {
          if (callback) {
            scheduleOnRN(callback);
          }
        },
      );
    },
    [fadeAnim, slideAnim],
  );

  const handleClose = useCallback(() => {
    handleAnimation(false, onClose);
  }, [handleAnimation, onClose]);

  const handleConfirm = useCallback(() => {
    handleAnimation(false, () => onConfirm(tempValue));
  }, [onConfirm, tempValue, handleAnimation]);

  useEffect(() => {
    if (visible) {
      // 异常处理
      if (!data.length) {
        // 代码中应当提前判断data为空的情况，不弹出Picker并提示用户，而不是走到这里
        console.error('PickerModal data is empty');
        toast.error('当前没有可选择项，请通过我的-帮助与反馈联系开发者解决此问题。');
        handleClose();
        return;
      }
      if (!data.some(item => item.value === value)) {
        // 触发情况：新生在开学前即登录，切换学期时默认选中的学期为上一学期，不在该生就读学期列表内
        console.error('PickerModal value is not in data', value, data);
        // fallback到第一项
        setTempValue(data[0].value);
      } else {
        setTempValue(value);
      }
      setPickerKey(prev => prev + 1); // 强制重新渲染解决偏移问题
      handleAnimation(true);
    }
  }, [data, handleAnimation, handleClose, value, visible]);

  const onValueChanged = useCallback(({ item }: { item: { value: T } }) => {
    try {
      setTempValue(item.value);
    } catch (error) {
      // 由于Picker三方库的原因，当出现data为空时，onValueChanged会在渲染时触发一次，导致item为空的崩溃
      // 上面的异常处理逻辑已经在这种情况下提前拒绝Picker的弹出，此处兜底避免崩溃
      console.error('PickerModal onValueChanged error', error);
    }
  }, []);

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  const pickerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideAnim.value }],
  }));

  return (
    <Modal visible={visible} transparent navigationBarTranslucent statusBarTranslucent onRequestClose={handleClose}>
      <View className="flex flex-1 justify-end">
        {/* 背景阴影 */}
        <Animated.View className="absolute h-full w-full" style={backgroundStyle}>
          <Pressable className="flex-1 bg-[#00000050]" onPress={handleClose} />
        </Animated.View>
        {/* Picker部分 */}
        <Animated.View className="space-y-6 rounded-t-3xl bg-background p-6" style={pickerStyle}>
          <View className="flex-row justify-between">
            <Pressable onPress={handleClose}>
              <IcCancel className="m-1 h-6 w-6" />
            </Pressable>
            <Text className="text-xl font-bold text-primary">{title}</Text>
            <Pressable onPress={handleConfirm}>
              <IcConfirm className="m-1 h-6 w-6" />
            </Pressable>
          </View>
          <WheelPicker
            key={pickerKey}
            style={styles.wheelpicker}
            data={data}
            value={tempValue}
            onValueChanged={onValueChanged}
            itemTextStyle={itemTextStyle}
            enableScrollByTapOnItem
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

// 解决滚动到高处时按钮无法点击（iOS）
const styles = StyleSheet.create({ wheelpicker: { overflow: 'hidden' } });
