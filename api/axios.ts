import { RejectEnum, ResultEnum } from '@/api/enum';
import { userLogin } from '@/utils/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosRequestConfig } from 'axios';

const baseURL = 'https://fzuhelper.west2.online/';

const request = axios.create({
  baseURL,
  timeout: 5000,
});

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

    // 鉴权出现问题
    if (data.code === ResultEnum.AuthInvalidCode) {
      return Promise.reject({ type: RejectEnum.AuthFailed });
    }

    // accessToken过期
    if (data.code === ResultEnum.AuthAccessExpiredCode) {
      refreshing = true;

      // 尝试刷新token
      try {
        const res = await axios.get('/api/v1/login/refresh-token', {
          baseURL,
          timeout: 5000,
          headers: {
            Authorization: await AsyncStorage.getItem('refresh_token'),
          },
        });
        if (res.data.code !== ResultEnum.SuccessCode) {
          throw res;
        }

        const { 'access-token': accessToken, 'refresh-token': refreshToken } = res.headers;
        accessToken && (await AsyncStorage.setItem('access_token', accessToken));
        refreshToken && (await AsyncStorage.setItem('refresh_token', refreshToken));

        queue.forEach(({ config, resolve }) => {
          resolve(request(config));
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
          queue.forEach(({ config, reject }) => {
            reject(request(config));
          });
          refreshing = false;
          queue = [];
        }
      }
    }
    // 处理jwch cookie异常
    if (data.code === ResultEnum.BizJwchCookieExceptionCode) {
      // 尝试重新登录并获取cookies和id
      const id = await AsyncStorage.getItem('user_id');
      const password = await AsyncStorage.getItem('user_password');
      if (id && password) {
        refreshing = true;
        try {
          await userLogin({
            id,
            password,
          });
          queue.forEach(({ config, resolve }) => {
            resolve(request(config));
          });
          refreshing = false;

          queue = [];
          return request(config);
        } catch (error) {
          // 重新登录失败，我们返回 ReLoginFailed
          queue.forEach(({ reject }) => {
            reject();
          });
          refreshing = false;
          queue = [];
          return Promise.reject({ type: RejectEnum.ReLoginFailed });
        }
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
    accessToken && (await AsyncStorage.setItem('access_token', accessToken));
    refreshToken && (await AsyncStorage.setItem('refresh_token', refreshToken));

    return response;
  },
  error => {
    // 请求超时
    if (error.message.indexOf('timeout') !== -1) {
      return Promise.reject({ type: RejectEnum.Timeout });
    }
    // 网络故障
    if (error.message.indexOf('Network Error') !== -1) {
      return Promise.reject({ type: RejectEnum.InternalFailed });
    }

    return Promise.reject({ type: RejectEnum.InternalFailed });
  },
);

request.interceptors.request.use(async function (config) {
  const accessToken = await AsyncStorage.getItem('access_token');
  const id = await AsyncStorage.getItem('id');
  const cookies = await AsyncStorage.getItem('cookies');
  if (accessToken) {
    config.headers.Authorization = accessToken;
    config.headers['Access-Token'] = accessToken;
  }
  if (id) {
    config.headers.Id = id;
  }
  if (cookies) {
    config.headers.Cookies = cookies;
  }
  return config;
});

export default request;
