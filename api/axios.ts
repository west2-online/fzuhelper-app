import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { type AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios';

import { RejectEnum, ResultEnum } from '@/api/enum';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/lib/constants';
import { LocalUser } from '@/lib/user';
import { type RejectError } from '@/types/reject-error';
import { isApiData, isHeaders, isNativeLoginError } from '@/types/type-guards';

const baseURL = 'https://fzuhelper.west2.online/';

const request = axios.create({
  baseURL,
  timeout: 5000,
});

type PromiseExecutorParameters = Parameters<ConstructorParameters<typeof Promise<AxiosResponse<any, any>>>[0]>;
// 请求队列
interface PendingTask {
  config: AxiosRequestConfig;
  resolve: PromiseExecutorParameters[0];
  reject: PromiseExecutorParameters[1];
}

// 标记当前是否在刷新 token/cookie
let refreshing = false;
// 用于在刷新 token/cookie 时暂存请求，刷新完毕后重新获取
let queue: PendingTask[] = [];
// 白名单，防止重新获取时被拦截
const WhiteList = ['/api/v1/login/access-token'];

const refreshToken = async (headers: unknown) => {
  if (!isHeaders(headers)) return;
  if (headers['access-token']) {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, headers['access-token']);
  }
  if (headers['refresh-token']) {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, headers['refresh-token']);
  }
};

// 用于提供类型检查，本文件中所有的 throw 和 Promise.reject 都应该使用这个保证类型安全
function rejectWith(obj: RejectError) {
  return Promise.reject(obj);
}

// 对于失败的样例，我们会返回一个 Promise.reject，但并不会直接回到页面逻辑，会在 hooks/useSafeResponseSolve.ts 中进一步处理
request.interceptors.response.use(
  async response => {
    let data: unknown = response.data;
    let config = response.config;

    if (refreshing && config.url && !WhiteList.includes(config.url)) {
      return new Promise((resolve, reject) => {
        queue.push({
          config,
          resolve,
          reject,
        });
      });
    }

    // 不要删除，便于调试使用
    // console.log('url:', config.url, 'method:', config.method, 'status:', response.status);
    // console.log('data:', data);

    if (isApiData(data)) {
      // 鉴权出现问题
      if (data.code === ResultEnum.AuthInvalidCode) {
        return rejectWith({ type: RejectEnum.AuthFailed });
      }

      // accessToken 过期
      if (data.code === ResultEnum.AuthAccessExpiredCode) {
        console.log('触发服务端 AccessToken 过期代码，执行自动刷新');
        refreshing = true;

        // 尝试刷新token
        try {
          const res = await axios.get('/api/v1/login/refresh-token', {
            baseURL,
            timeout: 5000,
            headers: {
              Authorization: await AsyncStorage.getItem(REFRESH_TOKEN_KEY),
            },
          });
          if (res.data.code !== ResultEnum.SuccessCode) {
            // 这里颗粒度粗一点，直接表示鉴权失败，统一返回 Login 页
            return rejectWith({ type: RejectEnum.AuthFailed });
          }
          await refreshToken(res.headers);
          queue.forEach(({ config: queuedConfig, resolve }) => {
            resolve(request(queuedConfig));
          });
          refreshing = false;
          queue = [];
          return request(config);
        } catch (error: unknown) {
          console.log('refresh token error:', error); // 此处可以控制台打印一下问题
          queue.forEach(({ reject }) => reject(error));
          refreshing = false;
          queue = [];
        }
      }
      // 处理 jwch cookie异常
      if (data.code === ResultEnum.BizJwchCookieExceptionCode) {
        console.log('触发教务系统 Cookie 过期，执行自动重登');
        // 尝试重新登录并获取cookies和id
        refreshing = true;
        try {
          await LocalUser.login();
          queue.forEach(({ config: queuedConfig, resolve }) => {
            resolve(request(queuedConfig));
          });
          refreshing = false;
          queue = [];
          return request(config);
        } catch (error: unknown) {
          console.log('relogin error:', error); // 此处可以控制台打印一下问题
          queue.forEach(({ reject }) => reject());
          refreshing = false;
          queue = [];
          if (isNativeLoginError(error)) {
            return rejectWith({ type: RejectEnum.ReLoginFailed, data: error.data });
          } else {
            return rejectWith({ type: RejectEnum.ReLoginFailed, data: '未知错误' });
          }
        }
      }

      // 其他错误
      if (data.code !== ResultEnum.SuccessCode) {
        // 业务错误
        return rejectWith({
          type: RejectEnum.BizFailed,
          data: response.data,
        });
      }
    }

    // 更新 AccessToken 和 refreshToken
    await refreshToken(response.headers);
    return response;
  },
  (error: AxiosError<any, any>) => {
    // 请求超时
    if (error.message.indexOf('timeout') !== -1) {
      return rejectWith({ type: RejectEnum.Timeout });
    }
    // 网络故障
    if (error.message.indexOf('Network Error') !== -1) {
      return rejectWith({ type: RejectEnum.NetworkError });
    }

    return rejectWith({ type: RejectEnum.InternalFailed, data: error });
  },
);

request.interceptors.request.use(async config => {
  // 用于 api 鉴权
  const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  // 用于 本科生/研究生 教务系统
  const credentials = LocalUser.getCredentials();

  if (accessToken) {
    config.headers.Authorization = accessToken;
    config.headers['Access-Token'] = accessToken;
  }
  if (credentials.identifier) {
    config.headers.Id = credentials.identifier;
  }
  if (credentials.cookies) {
    config.headers.Cookies = credentials.cookies;
  }
  return config;
});

export default request;
