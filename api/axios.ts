import { ResultEnum } from '@/api/enum';
import { userLogin } from '@/utils/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosRequestConfig } from 'axios';
import { router } from 'expo-router';
import { Alert } from 'react-native';

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
        if (error?.data?.code === ResultEnum.AuthRefreshExpiredCode) {
          // 重新输入账号密码登录
          Alert.alert('提示', '访问令牌已过期，请重新登录');
          router.push('/login');
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
      // TODO 尝试重新登录并获取cookies和id
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
          // TODO 判断是否为密码错误
          queue.forEach(({ reject }) => {
            reject();
          });
          refreshing = false;
          queue = [];
          return Promise.reject();
        }
      }
    }

    // 其他错误
    if (data.code !== ResultEnum.SuccessCode) {
      //TODO 错误消息提示处理
      return Promise.reject(response);
    }

    // 更新AccessToken和refreshToken
    const { 'access-token': accessToken, 'refresh-token': refreshToken } = response.headers;
    accessToken && (await AsyncStorage.setItem('access_token', accessToken));
    refreshToken && (await AsyncStorage.setItem('refresh_token', refreshToken));

    return response;
  },
  error => {
    // 判断是否为超时error
    if (error.message.indexOf('timeout') !== -1) {
      //TODO 超时消息处理
    }
    // 判断是否为网络error或者不存在页面
    if (error.message.indexOf('Network Error') !== -1) {
      //TODO 网络错误消息处理
    }

    return Promise.reject(error);
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
