import { HAPTIC_ENABLED_KEY } from '@/lib/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticLevel = 'light' | 'medium' | 'heavy';

const IOS_IMPACT_MAP: Record<HapticLevel, Haptics.ImpactFeedbackStyle> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
};

const ANDROID_HAPTIC_MAP: Record<HapticLevel, Haptics.AndroidHaptics> = {
  light: Haptics.AndroidHaptics.Clock_Tick,
  medium: Haptics.AndroidHaptics.Confirm,
  heavy: Haptics.AndroidHaptics.Reject,
};

export async function triggerHaptic(level: HapticLevel = 'medium'): Promise<void> {
  const hapticEnabled = await AsyncStorage.getItem(HAPTIC_ENABLED_KEY);
  if (hapticEnabled !== 'true') {
    return;
  }

  try {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(IOS_IMPACT_MAP[level]);
      return;
    }

    if (Platform.OS === 'android') {
      await Haptics.performAndroidHapticsAsync(ANDROID_HAPTIC_MAP[level]);
    }
  } catch (error) {
    console.warn('触发震动失败:', error);
  }
}
