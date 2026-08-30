import NativeWidgetModule from '@/modules/native-widget/src/NativeWidgetModule';

export async function setWidgetData(...args: any): Promise<void> {
  await NativeWidgetModule.setWidgetData(...args);
}

export function requestPinAppWidget(...args: any): Promise<number> {
  return NativeWidgetModule.requestPinAppWidget(...args);
}
