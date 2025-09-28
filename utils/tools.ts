import { type Href, useRouter } from 'expo-router';
import { toast } from 'sonner-native';

import type { WebParams } from '@/app/common/web';
import { USER_TYPE_POSTGRADUATE, USER_TYPE_UNDERGRADUATE } from '@/lib/user';
import { getWebViewHref } from '@/lib/webview';

export enum ToolType {
  LINK = 'link', // 跳转路由
  FUNCTION = 'function', // 执行函数
  WEBVIEW = 'webview', // 打开 WebView
  NULL = 'null', // 空操作
}
export type UserType = typeof USER_TYPE_UNDERGRADUATE | typeof USER_TYPE_POSTGRADUATE;

export type Tool = {
  name: string;
  icon?: any;
  userTypes?: UserType[]; // 可选属性，用于指定适用的用户类型
} & (
  | {
      type: ToolType.LINK;
      href: Href;
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

export type ToolboxTool = Tool & {
  id: number;
  message?: string;
  extra?: string;
};

export function isToolboxTool(obj: any): obj is ToolboxTool {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string' &&
    ('icon' in obj || obj.icon === null) &&
    'type' in obj
  );
}

// 工具按钮的点击事件
export const toolOnPress = (tool: Tool, router: ReturnType<typeof useRouter>) => {
  switch (tool.type) {
    case ToolType.NULL: // 空操作
      break;
    case ToolType.LINK: // 跳转路由
      router.push(tool.href);
      break;
    case ToolType.WEBVIEW: // 打开 WebView
      router.push(getWebViewHref(tool.params));
      break;
    case ToolType.FUNCTION: // 执行函数，并传入 router 参数
      tool.action(router);
      break;
    default:
      toast.error('未知工具类型');
      console.error('未知工具类型', tool);
  }
};
