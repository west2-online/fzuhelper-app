import WheelPicker from '@quidone/react-native-wheel-picker';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, View, useColorScheme } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import IcCancel from '@/assets/images/misc/ic_cancel.svg';
import IcConfirm from '@/assets/images/misc/ic_confirm.svg';
import { Text } from '@/components/ui/text';

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
  const colorScheme = useColorScheme();
  const itemTextStyle = useMemo(() => ({ color: colorScheme === 'dark' ? 'white' : 'black' }), [colorScheme]);

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

  useEffect(() => {
    // newArch下，关闭时重置选中值，打开时重新渲染，否则高度偏移有问题
    setTempValue(visible ? value : (undefined as T));
    if (visible) {
      handleAnimation(true);
    }
  }, [visible, value, slideAnim, fadeAnim, handleAnimation]);

  const handleClose = useCallback(() => {
    handleAnimation(false, onClose);
  }, [handleAnimation, onClose]);

  const handleConfirm = useCallback(() => {
    handleAnimation(false, () => onConfirm(tempValue));
  }, [onConfirm, tempValue, handleAnimation]);

  const onValueChanged = useCallback(({ item }: { item: { value: T } }) => {
    setTempValue(item.value);
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
