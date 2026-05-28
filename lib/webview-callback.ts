/**
 * WebView 回调共享状态
 *
 * 用于在 WebView 和原生页面（如扫码页）之间传递回调数据。
 * 原生页面完成操作后将结果存入，WebView 获得焦点时取出并注入 JS 执行。
 */

interface PendingCallback {
  /** 要调用的 window 上的函数名 */
  func: string;
  /** 函数参数（原始字符串，注入时会做 JSON 转义） */
  args: string;
}

let _pendingCallback: PendingCallback | null = null;

export function setWebViewCallback(callback: PendingCallback) {
  _pendingCallback = callback;
}

export function consumeWebViewCallback(): PendingCallback | null {
  const cb = _pendingCallback;
  _pendingCallback = null;
  return cb;
}
