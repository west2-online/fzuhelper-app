import Geolocation from '@react-native-community/geolocation';
import { Platform } from 'react-native';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
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
// 注入一段 JS，调用 window[func](args)；args 可以是字符串、对象、布尔等任意可 JSON 序列化的值。
export function buildCallbackJS(func: string, args: unknown): string {
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

const EMPTY_ADDRESS = { city: '', district: '', street: '', streetNumber: '' };

// 定位协议
// kysk-fdxy-app://native?type=location&function=nativeCallJsSchemeLocation
// 成功 → window[func]({ lon: '<经度>', lat: '<纬度>', address: { city:'', district:'', street:'', streetNumber:'' } })
// 失败/拒绝 → window[func]({ lon: '', lat: '', address: { ...空字段 } })
registerProtocol({
  parse: url => {
    const result = parseFdxyAppScheme(url);
    if (!result) return null;
    if (result.type === 'location') return { func: result.func || '' };
    return null;
  },
  handler: ({ parsed, context }) => {
    if (!parsed.func) {
      toast.error('无效链接：缺少回调函数');
      return true;
    }
    const failPayload = { lon: '', lat: '', address: EMPTY_ADDRESS };

    const proceed = () => {
      Geolocation.getCurrentPosition(
        position => {
          context.injectJS(
            buildCallbackJS(parsed.func, {
              lon: String(position.coords.longitude),
              lat: String(position.coords.latitude),
              address: EMPTY_ADDRESS,
            }),
          );
        },
        err => {
          console.warn('Geolocation.getCurrentPosition failed:', err);
          context.injectJS(buildCallbackJS(parsed.func, failPayload));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 },
      );
    };

    if (Platform.OS === 'android') {
      // Android：先确认/请求 ACCESS_FINE_LOCATION，再获取定位
      check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION).then(status => {
        if (status === RESULTS.GRANTED) {
          proceed();
        } else {
          request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION).then(s => {
            if (s === RESULTS.GRANTED) {
              proceed();
            } else {
              context.injectJS(buildCallbackJS(parsed.func, failPayload));
            }
          });
        }
      });
    } else {
      // iOS：app/common/web.tsx 已在挂载时调用 Geolocation.requestAuthorization()
      proceed();
    }

    return true;
  },
});

// 权限协议（当前仅支持 biz=location）
// kysk-fdxy-app://native?type=permission&biz=location&action=0|1[&function=xxx]
//   action=0 仅查询权限状态；action=1 申请权限并返回状态
//   回调参数：boolean（true 表示已授权）
registerProtocol({
  parse: url => {
    try {
      const u = new URL(url);
      if (u.protocol !== 'kysk-fdxy-app:') return null;
      if (u.searchParams.get('type') !== 'permission') return null;
      const biz = u.searchParams.get('biz');
      const action = u.searchParams.get('action');
      const func = u.searchParams.get('function') || '';
      // 本期仅实现 location；其他 biz 后续扩展
      if (biz !== 'location') return null;
      if (action !== '0' && action !== '1') return null;
      return { biz, action, func };
    } catch {
      return null;
    }
  },
  handler: ({ parsed, context }) => {
    const perm =
      Platform.OS === 'ios' ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
    const op = parsed.action === '1' ? request : check;
    op(perm).then(status => {
      if (parsed.func) {
        context.injectJS(buildCallbackJS(parsed.func, status === RESULTS.GRANTED));
      }
    });
    return true;
  },
});
