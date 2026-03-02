import NativeWidgetModule from '@/modules/native-widget/src/NativeWidgetModule';

export function setWidgetData(...args: any) {
  NativeWidgetModule.setWidgetData(...args);
}

export function requestPinAppWidget(...args: any): Promise<number> {
  return NativeWidgetModule.requestPinAppWidget(...args);
}
