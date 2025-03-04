import { USER_TYPE_POSTGRADUATE, USER_TYPE_UNDERGRADUATE } from '@/lib/user';
import { Href, useRouter } from 'expo-router';
import { Alert, Linking } from 'react-native';
import { toast } from 'sonner-native';

export enum ToolType {
  LINK = 'link', // 跳转路由
  URL = 'URL', // 打开网页
  FUNCTION = 'function', // 执行函数
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
    case ToolType.LINK: // 跳转路由
      router.push(tool.href);
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
