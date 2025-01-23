import ExpoUmengModule from './src/ExpoUmengModule';

interface PushTagResponse {
  // data 是一个字符串数组，表示当前设备的所有 tag
  data: string[];
  // remain 是一个数字，表示剩余可设置的 tag 数量
  remain: number;
  // error 是一个字符串，表示错误信息
  error: string;
}

interface Umeng {
  // 初始化友盟统计 用户同意协议才能调用 一般开屏页调用，不会阻塞调用方
  // 安卓和 iOS 的实现逻辑略有不同，但调用一致：同意协议弹窗后调用，然后每次打开App调用
  initUmeng(): void;

  // 检查是否授予通知权限
  hasPermission(): boolean;

  // 请求通知权限 注意做好用户引导（合规）
  // iOS上是空操作，打开 App 时就会请求通知权限
  requirePermission(): void;

  // 获取 DeviceToken
  getDeviceToken(): Promise<string>;

  // 获取注册状态信息
  isRegisteredForRemoteNotifications(): Promise<boolean>;

  // 获取错误信息
  getError(): Promise<string>;

  // 获取 AppKey 以及 Channel
  getAppKeyAndChannel(): Promise<string>;

  // 获取全部 tag
  getAllTags(): Promise<PushTagResponse>;

  // 添加 tag
  addTags(tag: string[]): Promise<void>;

  // 删除 tag
  deleteTags(tag: string[]): Promise<void>;
}

export default ExpoUmengModule as Umeng;
