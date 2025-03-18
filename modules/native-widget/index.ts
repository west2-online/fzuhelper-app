// Reexport the native module. On web, it will be resolved to NativeWidgetModule.web.ts
// and on native platforms to NativeWidgetModule.ts
import NativeWidgetModule from './NativeWidgetModule';

export function setWidgetData(...args: any) {
  NativeWidgetModule.setWidgetData(...args);
}
