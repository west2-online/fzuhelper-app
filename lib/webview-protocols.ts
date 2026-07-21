import { toast } from 'sonner-native';

// --- 注册表类型 ---
export type ProtocolContext = {
  router: any;
  injectJS: (code: string) => void;
};

export interface ProtocolItem<
  ParseFn extends (url: string) => any | null,
  HandlerFn extends (params: { parsed: NonNullable<ReturnType<ParseFn>>; context: ProtocolContext }) => boolean,
> {
  /** 检查 URL 是否应由本协议处理，返回解析后的参数或 null */
  parse: ParseFn;
  /** 执行协议逻辑，返回 true 表示已处理（阻止 WebView 加载） */
  handler: HandlerFn;
}

// --- 注册表 ---
const items: ProtocolItem<any, any>[] = [];

export function registerProtocol<
  ParseFn extends (url: string) => any,
  HandlerFn extends (params: { parsed: NonNullable<ReturnType<ParseFn>>; context: ProtocolContext }) => boolean,
>(item: ProtocolItem<ParseFn, HandlerFn>) {
  items.push(item);
}

/**
 * 检查 URL 是否为自定义协议，如果是则执行对应 handler。
 * 返回 true 表示已处理（调用方应阻止 WebView 加载），false 表示非协议 URL。
 */
export function handleCustomProtocol(url: string, context: ProtocolContext): boolean {
  for (const item of items) {
    const parsed = item.parse(url);
    if (parsed) {
      console.log('匹配到协议，参数：', parsed, 'URL:', url);
      return item.handler({ parsed, context });
    }
  }
  return false;
}

// --- 工具函数 ---
export function buildCallbackJS(func: string, args: string): string {
  const safeFunc = func.replace(/[^a-zA-Z0-9_]/g, '');
  const safeArgs = JSON.stringify(args);
  return `
    (function() {
      try {
        if (typeof window['${safeFunc}'] === 'function') {
          window['${safeFunc}'](${safeArgs});
        }
      } catch(e) {
        console.error('回调失败:', e);
      }
    })();
    true;
  `;
}

interface FdxyAppSchemeParams {
  type: string;
  func: string | null;
}

// kysk-fdxy-app://native?type=xxx&function=yyy
function parseFdxyAppScheme(url: string): FdxyAppSchemeParams | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'kysk-fdxy-app:') return null;
    // 学习中心不带这个 native 路径，所以不强制要求这个检测，增强兼容性
    // if (parsed.pathname !== '/native') return null;
    const type = parsed.searchParams.get('type');
    if (!type) return null;
    const func = parsed.searchParams.get('function');
    return { type, func };
  } catch {
    return null;
  }
}

// 扫码协议
// 这个是需要跳转页面执行一些操作的
registerProtocol({
  parse: url => {
    const result = parseFdxyAppScheme(url);
    if (!result) return null;
    if (result.type === 'scan') return { func: result.func || '' };
    return null;
  },
  handler: ({ parsed, context }) => {
    if (!parsed.func) {
      toast.error('无效链接：缺少回调函数');
      return true;
    }
    context.router.push({
      pathname: '/toolbox/learning-center/qr-scanner',
      params: { callback: parsed.func },
    });
    return true;
  },
});

// 一种直接注入回调结果的协议示例（如果不需要跳转页面，直接在原页面执行回调）
// registerProtocol({
//   parse: url => {
//     const result = parseFdxyAppScheme(url);
//     if (!result) return null;
//     if (result.type === 'sample2') return { func: result.func || '' };
//     return null;
//   },
//   handler: ({ parsed, context }) => {
//     if (!parsed.func) {
//       toast.error('无效：缺少回调函数');
//       return true;
//     }
//     // do something.
//     context.injectJS(buildCallbackJS(parsed.func, JSON.stringify({ lon: longitude, lat: latitude })));
//     return true;
//   },
// });
