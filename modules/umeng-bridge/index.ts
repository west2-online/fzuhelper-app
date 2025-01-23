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
  // 初始化友盟统计 用户同意协议才能调用 一般开屏页调用
  // 里面是开了个线程（协程），不会阻塞调用方
  initUmeng(): void;

  // 检查是否授予通知权限
  hasPermission(): boolean;

  // 请求通知权限 注意做好用户引导（合规），iOS上是空操作，打开 App 时就会请求通知权限
  requirePermission(): void;

  // 获取 DeviceToken
  getDeviceToken(): Promise<string>;

  // 获取注册状态信息
  isRegisteredForRemoteNotifications(): Promise<boolean>;

  // 获取错误信息
  getError(): Promise<string>;

  // 获取 AppKey 以及 Channel
  getAppKeyAndChannel(): Promise<string>;

  // 设置允许隐私协议
  setAllowPrivacy(): Promise<void>;

  // 是否允许隐私协议
  isAllowPrivacy(): Promise<boolean>;

  // 获取全部 tag
  getAllTags(): Promise<PushTagResponse>;

  // 添加 tag
  addTag(tag: string): Promise<PushTagResponse>;

  // 删除 tag
  deleteTag(tag: string): Promise<PushTagResponse>;
}

export default ExpoUmengModule as Umeng;
