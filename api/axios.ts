import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosRequestConfig } from 'axios';

import { RejectEnum, ResultEnum } from '@/api/enum';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/lib/constants';
import { LocalUser } from '@/lib/user';

const baseURL = 'https://fzuhelper.west2.online/';

const request = axios.create({
  baseURL,
  timeout: 5000,
});

// 请求队列
interface PendingTask {
  config: AxiosRequestConfig;
  resolve: Function;
  reject: Function;
}

let refreshing = false;
let queue: PendingTask[] = [];
// 白名单，防止重新获取时被拦截
const WhiteList = ['/api/v1/login/access-token', '/api/v1/internal/user/login'];

// 对于失败的样例，我们会返回一个 Promise.reject，但并不会直接回到页面逻辑，会在 hooks/useSafeResponseSolve.ts 中进一步处理
request.interceptors.response.use(
  async response => {
    let { data, config } = response;

    if (refreshing && !WhiteList.includes(config.url || '')) {
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

    // 鉴权出现问题
    if (data.code === ResultEnum.AuthInvalidCode) {
      return Promise.reject({ type: RejectEnum.AuthFailed });
    }

    // accessToken过期
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
          throw res;
        }

        const { 'access-token': accessToken, 'refresh-token': refreshToken } = res.headers;
        accessToken && (await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken));
        refreshToken && (await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken));

        queue.forEach(({ config: queuedConfig, resolve }) => {
          resolve(request(queuedConfig));
        });
        refreshing = false;
        queue = [];
        return request(config);
      } catch (error: any) {
        // 需要同时判断是否是 access-token 过期，否则会进入无限循环
        if (
          error?.data?.code === ResultEnum.AuthRefreshExpiredCode ||
          error?.data?.code === ResultEnum.AuthAccessExpiredCode
        ) {
          Promise.reject({ type: RejectEnum.AuthFailed }); // 这里颗粒度粗一点，直接表示鉴权失败，统一返回 Login 页
        } else {
          queue.forEach(({ config: queuedConfig, reject }) => {
            reject(request(queuedConfig));
          });
          refreshing = false;
          queue = [];
        }
      }
    }
    // 处理jwch cookie异常
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
      } catch (error: any) {
        console.log('relogin error:', error); // 此处可以控制台打印一下问题
        queue.forEach(({ reject }) => {
          reject();
        });
        refreshing = false;
        queue = [];
        return Promise.reject({ type: RejectEnum.ReLoginFailed });
      }
    }

    // 其他错误
    if (data.code !== ResultEnum.SuccessCode) {
      // 业务错误
      return Promise.reject({
        type: RejectEnum.BizFailed,
        data: response.data,
      });
    }

    // 更新AccessToken和refreshToken
    const { 'access-token': accessToken, 'refresh-token': refreshToken } = response.headers;
    accessToken && (await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken));
    refreshToken && (await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken));

    return response;
  },
  error => {
    // 请求超时
    if (error.message.indexOf('timeout') !== -1) {
      return Promise.reject({ type: RejectEnum.Timeout });
    }
    // 网络故障
    if (error.message.indexOf('Network Error') !== -1) {
      return Promise.reject({ type: RejectEnum.NetworkError });
    }

    return Promise.reject({ type: RejectEnum.InternalFailed });
  },
);

request.interceptors.request.use(async function (config) {
  const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
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
