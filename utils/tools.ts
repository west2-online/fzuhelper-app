import { useRouter, type Href } from 'expo-router';
import { Alert, Linking } from 'react-native';
import { toast } from 'sonner-native';

import type { WebParams } from '@/app/common/web';
import { USER_TYPE_POSTGRADUATE, USER_TYPE_UNDERGRADUATE } from '@/lib/user';
import { getWebViewHref } from '@/lib/webview';

export enum ToolType {
  LINK = 'link', // 跳转路由
  URL = 'URL', // 打开网页
  FUNCTION = 'function', // 执行函数
  WEBVIEW = 'webview', // 打开 WebView
  NULL = 'null', // 空操作
}
export type UserType = typeof USER_TYPE_UNDERGRADUATE | typeof USER_TYPE_POSTGRADUATE;

export type Tool = {
  name: string;
  icon: any;
  userTypes?: UserType[]; // 可选属性，用于指定适用的用户类型
} & (
  | {
      type: ToolType.LINK;
      href: Href;
    }
  | {
      type: ToolType.URL;
      href: string;
    }
  | {
      type: ToolType.WEBVIEW;
      params: WebParams;
    }
  | {
      type: ToolType.FUNCTION;
      action: (router: ReturnType<typeof useRouter>) => void | Promise<void>;
    }
  | {
      type: ToolType.NULL;
    }
);

// 工具按钮的点击事件
export const toolOnPress = (tool: Tool, router: ReturnType<typeof useRouter>) => {
  switch (tool.type) {
    case ToolType.NULL: // 空操作
      break;
    case ToolType.LINK: // 跳转路由（理论上不会执行到这句）
      router.push(tool.href);
      break;
    case ToolType.WEBVIEW: // 打开 WebView（理论上不会执行到这句，会在 renderToolButton 中分流）
      router.push(getWebViewHref(tool.params));
      break;
    case ToolType.URL: // 打开网页
      Linking.openURL(tool.href).catch(err => Alert.alert('错误', '无法打开链接 (' + err + ')'));
      break;
    case ToolType.FUNCTION: // 执行函数，并传入 router 参数
      tool.action(router);
      break;
    default:
      toast.error('未知工具类型');
      console.error('未知工具类型', tool);
  }
};
