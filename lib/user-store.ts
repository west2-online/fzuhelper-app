/**
 * @description 模块级用户状态单例。
 *
 * 该模块维护了教务系统的用户信息和登录凭据的内存副本，
 * 供 axios 拦截器等非 React 代码同步读取。
 *
 * React 侧通过 context/user.tsx 的 UserProvider 与此模块双向同步：
 * - Provider mount 时从 AsyncStorage 加载数据并写入此处
 * - 拦截器自动重登后通过 setUserState 写入，Provider 通过 subscribe 感知变更
 */

// ── 类型 ────────────────────────────────────────────────

export interface UserInfo {
  type: string;
  userid: string;
  password: string;
}

export interface LoginCredentials {
  identifier: string; // 本科生的身份识别用 id，研究生会设置为前导 0
  cookies: string; // 传递给教务系统的 Cookie Raw
}

export interface UserState {
  type: string;
  userid: string;
  password: string;
  identifier: string;
  cookies: string;
  isLoaded: boolean;
}

// ── 内部状态 ─────────────────────────────────────────────

const INITIAL_STATE: UserState = {
  type: '',
  userid: '',
  password: '',
  identifier: '',
  cookies: '',
  isLoaded: false,
};

let state: UserState = { ...INITIAL_STATE };

// ── 订阅机制（用于 store → Context 反向同步）────────────

type Listener = (state: Readonly<UserState>) => void;
const listeners = new Set<Listener>();

function notify() {
  const snapshot = { ...state };
  listeners.forEach(fn => fn(snapshot));
}

/** 订阅状态变更，返回取消订阅函数 */
export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// ── 同步读取（给 axios 拦截器和非 React 代码使用）──────

export function getUserState(): Readonly<UserState> {
  return state;
}

export function getCredentials(): LoginCredentials {
  return { identifier: state.identifier, cookies: state.cookies };
}

export function getUserInfo(): UserInfo {
  return { type: state.type, userid: state.userid, password: state.password };
}

// ── 同步写入（Context Provider 和 login 流程调用）──────

export function setUserState(partial: Partial<UserState>): void {
  Object.assign(state, partial);
  notify();
}

export function clearUserState(): void {
  state = { ...INITIAL_STATE };
  notify();
}
