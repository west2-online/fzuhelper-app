import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import {
  checkCredentials as checkCredentialsFn,
  clearUser,
  getCaptcha as getCaptchaFn,
  loadUser,
  logoutUser as logoutUserFn,
  performLogin as performLoginFn,
  setCredentials as setCredentialsFn,
  setUser as setUserFn,
} from '@/lib/user';
import { getUserState, subscribe, type LoginCredentials, type UserInfo } from '@/lib/user-store';

// ── Context 类型 ────────────────────────────────────────

interface UserContextValue {
  /** 用户基本信息（学号、类型），未登录时字段为空字符串 */
  user: UserInfo;
  /** 教务系统登录凭据，未登录时字段为空字符串 */
  credentials: LoginCredentials;
  /** 是否已从 AsyncStorage 加载完成 */
  isLoaded: boolean;

  /** 设置用户基本信息并持久化 */
  setUser: (type: string, username: string, password: string) => Promise<void>;
  /** 设置登录凭据并持久化 */
  setCredentials: (identifier: string, cookies: string) => Promise<void>;
  /** 执行登录流程 */
  login: (captcha?: string) => Promise<void>;
  /** 检查凭据是否有效 */
  checkCredentials: () => Promise<boolean>;
  /** 获取验证码图片 */
  getCaptcha: () => Promise<Uint8Array>;
  /** 清空用户信息（仅清除教务系统凭据） */
  clearUser: () => Promise<void>;
  /** 完整退出登录（清除课程缓存、网络缓存等） */
  logout: () => Promise<void>;
}

const defaultUser: UserInfo = { type: '', userid: '', password: '' };
const defaultCredentials: LoginCredentials = { identifier: '', cookies: '' };

const UserContext = createContext<UserContextValue | null>(null);

// ── Provider ────────────────────────────────────────────

export const UserProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUserState] = useState<UserInfo>(defaultUser);
  const [credentials, setCredentialsState] = useState<LoginCredentials>(defaultCredentials);
  const [isLoaded, setIsLoaded] = useState(false);
  const isMounted = useRef(true);

  // 从 AsyncStorage 加载初始数据
  useEffect(() => {
    isMounted.current = true;
    loadUser().then(() => {
      if (!isMounted.current) return;
      const state = getUserState();
      setUserState({ type: state.type, userid: state.userid, password: state.password });
      setCredentialsState({ identifier: state.identifier, cookies: state.cookies });
      setIsLoaded(true);
    });
    return () => {
      isMounted.current = false;
    };
  }, []);

  // 订阅 user-store 变更（拦截器自动重登后的反向同步）
  useEffect(() => {
    const unsubscribe = subscribe(snapshot => {
      if (!isMounted.current) return;
      setUserState({ type: snapshot.type, userid: snapshot.userid, password: snapshot.password });
      setCredentialsState({ identifier: snapshot.identifier, cookies: snapshot.cookies });
      setIsLoaded(snapshot.isLoaded);
    });
    return unsubscribe;
  }, []);

  const setUser = useCallback(async (type: string, username: string, password: string) => {
    await setUserFn(type, username, password);
  }, []);

  const setCredentialsCtx = useCallback(async (identifier: string, cookies: string) => {
    await setCredentialsFn(identifier, cookies);
  }, []);

  const login = useCallback(async (captcha?: string) => {
    await performLoginFn(captcha);
  }, []);

  const checkCredentialsCtx = useCallback(async () => {
    return await checkCredentialsFn();
  }, []);

  const getCaptcha = useCallback(async () => {
    return await getCaptchaFn();
  }, []);

  const clearUserCtx = useCallback(async () => {
    await clearUser();
  }, []);

  const logout = useCallback(async () => {
    await logoutUserFn();
  }, []);

  const value = useMemo<UserContextValue>(
    () => ({
      user,
      credentials,
      isLoaded,
      setUser,
      setCredentials: setCredentialsCtx,
      login,
      checkCredentials: checkCredentialsCtx,
      getCaptcha,
      clearUser: clearUserCtx,
      logout,
    }),
    [user, credentials, isLoaded, setUser, setCredentialsCtx, login, checkCredentialsCtx, getCaptcha, clearUserCtx, logout],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// ── Hook ────────────────────────────────────────────────

export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a <UserProvider>');
  }
  return context;
}
