import { post } from '@/modules/native-request';

function fetchWithTimeout(input: string, init: RequestInit, ms = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(id));
}

// 校园网自助服务系统地址
const SELFSERVICE_BASE = 'http://172.16.0.40:8080';
// 登录
const SELFSERVICE_LOGIN_URL = `${SELFSERVICE_BASE}/selfservice/module/scgroup/web/login_judge.jsf?mobileslef=true`;
// 主页
export const SELFSERVICE_HOME_URL = `${SELFSERVICE_BASE}/selfservice/module/webcontent/web/index_self.jsf`;
export { SELFSERVICE_BASE };

// 校园网认证系统地址
const PORTAL_HOST = '172.16.0.46';
const PORTAL_BASE = `http://${PORTAL_HOST}/eportal/InterFace.do`;
// 用于获取认证入口地址
const CAPTIVE_PORTAL_CHECK = 'http://123.123.123.123';

const FORM_HEADERS = { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' } as const;

// 在线状态
export type OnlineResult = 'success' | 'fail' | 'wait' | 'error' | null;

// 在线状态信息
export interface NetworkStatus {
  result: OnlineResult;
  userIp: string;
  userMac: string;
  // ePortal会话标识，登出、MAC注册等操作需要携带
  userIndex: string;
  // 当前设备MAC是否已注册无感认证
  mabRegistered: boolean;
}

export const STATUS_LABEL: Record<string, string> = {
  success: '在线',
  fail: '离线',
  wait: '等待中',
  error: '异常',
};

export const STATUS_COLOR: Record<string, string> = {
  success: 'text-green-500',
  fail: 'text-red-500',
  wait: 'text-yellow-500',
  error: 'text-orange-500',
};

// 查询当前在线状态，先刷新会话再重新获取，确保信息最新
export async function checkOnlineStatus(): Promise<NetworkStatus> {
  const firstResponse = await fetchWithTimeout(`${PORTAL_BASE}?method=getOnlineUserInfo`, {
    method: 'POST',
    headers: FORM_HEADERS,
    body: 'userIndex=',
  });
  const firstJson = await firstResponse.json();
  const userIndex: string = firstJson.userIndex ?? '';

  // 需要刷新一次，不然拿不到最新状态
  if (userIndex) {
    await fetchWithTimeout(`${PORTAL_BASE}?method=freshOnlineUserInfo`, {
      method: 'POST',
      headers: FORM_HEADERS,
      body: `userIndex=${encodeURIComponent(userIndex)}`,
    }).catch(() => {});
  }

  const response = await fetchWithTimeout(`${PORTAL_BASE}?method=getOnlineUserInfo`, {
    method: 'POST',
    headers: FORM_HEADERS,
    body: 'userIndex=',
  });
  const json = await response.json();
  let mabRegistered = false;
  try {
    const mabInfo = JSON.parse(json.mabInfo ?? '[]');
    const currentMac: string = (json.userMac ?? '').replace(/[:-]/g, '').toUpperCase();
    mabRegistered =
      Array.isArray(mabInfo) &&
      mabInfo.some(
        (entry: { userMac?: string }) => (entry.userMac ?? '').replace(/[:-]/g, '').toUpperCase() === currentMac,
      );
  } catch {
    // ignore
  }
  return {
    result: json.result ?? 'fail',
    userIp: json.userIp ?? '未知',
    userMac: json.userMac ?? '未知',
    userIndex: json.userIndex ?? '',
    mabRegistered,
  };
}

// 主动下线
export async function logoutNetwork(userIndex: string): Promise<boolean> {
  const response = await fetchWithTimeout(`${PORTAL_BASE}?method=logout`, {
    method: 'POST',
    headers: FORM_HEADERS,
    body: `userIndex=${encodeURIComponent(userIndex)}`,
  });
  const json = await response.json();
  return json.result === 'success';
}

// 开启无感认证
export async function registerMac(userIndex: string): Promise<boolean> {
  const response = await fetchWithTimeout(`${PORTAL_BASE}?method=registerMac`, {
    method: 'POST',
    headers: FORM_HEADERS,
    body: `mac=&userIndex=${encodeURIComponent(userIndex)}`,
  });
  const json = await response.json();
  return json.result === 'success';
}

// 关闭无感认证
export async function cancelMac(userIndex: string): Promise<boolean> {
  const response = await fetchWithTimeout(`${PORTAL_BASE}?method=cancelMac`, {
    method: 'POST',
    headers: FORM_HEADERS,
    body: `mac=&userIndex=${encodeURIComponent(userIndex)}`,
  });
  const json = await response.json();
  return json.result === 'success';
}

// 登录校园网 触发重定向 -> 拿到认证地址和Session -> 提交登录表单
export async function loginNetwork(username: string, password: string): Promise<{ success: boolean; message: string }> {
  let redirectUrl = '';
  try {
    const portalResponse = await fetchWithTimeout(CAPTIVE_PORTAL_CHECK, { redirect: 'manual' });
    const location = portalResponse.headers.get('location');
    if (location && location.includes(PORTAL_HOST)) {
      redirectUrl = location;
    } else {
      const text = await portalResponse.text().catch(() => '');
      const match = text.match(/location\.href='([^']+)'/);
      if (match && match[1].includes(PORTAL_HOST)) {
        redirectUrl = match[1];
      }
    }
    if (!redirectUrl) {
      return { success: false, message: '无法获取认证地址，请确认处于校园网环境且尚未登录' };
    }
  } catch {
    return { success: false, message: '无法连接校园网门户，请确认处于校园网环境' };
  }

  let sessionCookie = '';
  let encodedQueryString = '';
  try {
    const redirectResponse = await fetchWithTimeout(redirectUrl, {});
    const setCookie = redirectResponse.headers.get('set-cookie') ?? '';
    const cookieMatch = setCookie.match(/JSESSIONID=([^;,\s]+)/);
    if (cookieMatch) {
      sessionCookie = `JSESSIONID=${cookieMatch[1]}`;
    }
    const questionIndex = redirectUrl.indexOf('?');
    if (questionIndex !== -1) {
      encodedQueryString = encodeURIComponent(redirectUrl.slice(questionIndex + 1));
    }
  } catch {
    return { success: false, message: '访问认证页面失败' };
  }

  try {
    await fetchWithTimeout(`${PORTAL_BASE}?method=pageInfo`, {
      method: 'POST',
      headers: { ...FORM_HEADERS, Referer: redirectUrl, ...(sessionCookie ? { Cookie: sessionCookie } : {}) },
      body: `queryString=${encodedQueryString}`,
    });
  } catch {
    // ignore
  }

  const body = [
    `userId=${encodeURIComponent(username)}`,
    `password=${encodeURIComponent(password)}`,
    `queryString=${encodedQueryString}`,
    `passwordEncrypt=false`,
    `validcode=`,
    `operatorUserId=`,
    `operatorPwd=`,
    `service=`,
  ].join('&');

  try {
    const loginResponse = await fetchWithTimeout(`${PORTAL_BASE}?method=login`, {
      method: 'POST',
      headers: { ...FORM_HEADERS, Referer: redirectUrl, ...(sessionCookie ? { Cookie: sessionCookie } : {}) },
      body,
    });
    const json = await loginResponse.json();
    if (json.result === 'success') {
      return { success: true, message: '登录成功' };
    }
    return { success: false, message: json.message ?? '登录失败' };
  } catch {
    return { success: false, message: '登录请求超时，请稍后重试' };
  }
}

// 登录校园网自助服务系统，返回Cookie供WebView注入
export async function loginSelfService(userid: string, password: string): Promise<string> {
  const resp = await post(SELFSERVICE_LOGIN_URL, FORM_HEADERS, { name: userid, password });
  const setCookie = resp.headers['Set-Cookie'] || resp.headers['set-cookie'];
  if (!setCookie) {
    throw new Error('自助服务系统登录失败，未获取到Cookie');
  }
  return setCookie
    .split(/,(?=[^ ])/g)
    .map((c: string) => c.split(';')[0].trim())
    .filter(Boolean)
    .join('; ');
}
