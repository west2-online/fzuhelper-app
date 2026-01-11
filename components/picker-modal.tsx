import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import IcCancel from '@/assets/images/misc/ic_cancel.svg';
import IcConfirm from '@/assets/images/misc/ic_confirm.svg';
import { Text } from '@/components/ui/text';
import { WheelPicker, WheelPickerValue, WheelPickerWrapper } from '@ncdai/react-wheel-picker';
import '@ncdai/react-wheel-picker/style.css';

interface PickerModalProps<T> {
  visible: boolean;
  title: string;
  data: { value: T; label: string }[];
  value: T;
  onClose: () => void;
  onConfirm: (value: T) => void;
}

export default function PickerModal<T extends WheelPickerValue>({
  visible,
  title,
  data,
  value,
  onClose,
  onConfirm,
}: PickerModalProps<T>) {
  const [tempValue, setTempValue] = useState(value);

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
    if (visible) {
      setTempValue(value);
      handleAnimation(true);
    }
  }, [handleAnimation, value, visible]);

  const handleClose = useCallback(() => {
    handleAnimation(false, onClose);
  }, [handleAnimation, onClose]);

  const handleConfirm = useCallback(() => {
    handleAnimation(false, () => onConfirm(tempValue));
  }, [onConfirm, tempValue, handleAnimation]);

  const onValueChanged = useCallback((newValue: T) => {
    setTempValue(newValue);
  }, []);

  const options = useMemo(() => {
    return data.map(item => ({
      value: item.value,
      label: <Text className="w-full text-center text-lg text-black dark:text-white">{item.label}</Text>,
    }));
  }, [data]);

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
          <WheelPickerWrapper>
            <WheelPicker
              options={options}
              value={tempValue}
              onValueChange={onValueChanged}
              optionItemHeight={45}
              visibleCount={16}
              classNames={{
                highlightItem: 'bg-black/5 rounded-md',
              }}
            />
          </WheelPickerWrapper>
        </Animated.View>
      </View>
    </Modal>
  );
}
