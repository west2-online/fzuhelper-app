import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';
import { Alert } from 'react-native';

import { RejectEnum } from '@/api/enum';
import { useRedirectWithoutHistory } from '@/hooks/useRedirectWithoutHistory';
import { ACCESS_TOKEN_KEY, JWCH_COOKIES_KEY, JWCH_ID_KEY, REFRESH_TOKEN_KEY } from '@/lib/constants';

interface RejectError {
  type: RejectEnum; // Type 被精简为只有 6 种，具体查看 api/enum.ts
  data?: any; // 仅当 type 为 RejectEnum.BizFailed 时存在
}

// useSafeResponseSolve 适用于安全地处理 Axios 响应错误
// Axios 的错误对象中包含了 type 字段，这段逻辑会根据 type 的不同进行不同的处理
export const useSafeResponseSolve = () => {
  const redirect = useRedirectWithoutHistory();

  /**
   * 处理错误的通用函数
   * @param error Axios reject 抛出的错误对象
   */
  const handleError = useCallback(
    (error: RejectError) => {
      if (!error || !error.type) {
        console.error('未知错误:', error);
        Alert.alert('错误', '发生未知错误，请稍后再试');
        return;
      }

      switch (error.type) {
        case RejectEnum.AuthFailed:
          console.error('鉴权出现异常');
          Alert.alert(
            '提示',
            '登录过期，请重新登录',
            [
              {
                text: '确认',
                onPress: () => {
                  AsyncStorage.multiRemove([JWCH_ID_KEY, JWCH_COOKIES_KEY, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
                  redirect('/login');
                },
              },
            ],
            { cancelable: false },
          );
          break;

        case RejectEnum.ReLoginFailed:
          console.error('重新登录时遇到问题');
          Alert.alert(
            '提示',
            '自动登录失败，请检查账号信息，并重新登录',
            [
              {
                text: '确认',
                onPress: () => {
                  AsyncStorage.multiRemove([JWCH_ID_KEY, JWCH_COOKIES_KEY, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
                  redirect('/login');
                },
              },
            ],
            { cancelable: false },
          );
          break;

        case RejectEnum.BizFailed:
          // 返回业务数据（如果需要在调用处处理），这里直接返回感觉怪怪的，可以协助修改一下
          return error.data;

        case RejectEnum.InternalFailed:
          console.error('内部异常:', error);
          Alert.alert('提示', '网络错误或服务器异常，请稍后再试');
          // 这里可以触发一些额外的错误处理逻辑
          break;

        case RejectEnum.Timeout:
          console.error('请求超时:', error);
          Alert.alert('提示', '请求超时，请稍后再试');
          break;

        case RejectEnum.NetworkError:
          console.error('网络异常:', error);
          Alert.alert('提示', '网络异常，请检查网络连接');
          break;

        default:
          console.error('未知错误类型:', error);
          Alert.alert('错误', '发生未知错误，请稍后再试');
          break;
      }
    },
    [redirect],
  );

  return { handleError };
};
