import ExpoUmengModule from './src/ExpoUmengModule';

interface Umeng {
  // 初始化友盟统计 用户同意协议才能调用 一般开屏页调用
  // 里面是开了个线程（协程），不会阻塞调用方
  initUmeng(): void;
  // 检查是否授予通知权限
  hasPermission(): boolean;
  // 请求通知权限 注意做好用户引导（合规）
  requirePermission(): void;
}

export default ExpoUmengModule as Umeng;
