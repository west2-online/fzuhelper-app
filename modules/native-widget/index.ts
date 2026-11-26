import NativeWidgetModule from '@/modules/native-widget/src/NativeWidgetModule';
import { ExtensionStorage } from '@bacons/apple-targets';
import { Platform } from 'react-native';

export async function refreshCourseWidgets(): Promise<void> {
  if (Platform.OS === 'ios') {
    ExtensionStorage.reloadWidget('widget');
  } else {
    await NativeWidgetModule.refreshCourseWidgets();
  }
}

export async function setWidgetData(...args: any): Promise<void> {
  await NativeWidgetModule.setWidgetData(...args);
}

export function requestPinAppWidget(...args: any): Promise<number> {
  return NativeWidgetModule.requestPinAppWidget(...args);
}
