import { RejectEnum } from '@/api/enum';
import { useRedirectWithoutHistory } from '@/hooks/useRedirectWithoutHistory';
import { clearUserStorage } from '@/utils/user';
import { useCallback } from 'react';
import { Alert } from 'react-native';

interface RejectError {
  type: RejectEnum; // Type 被精简为只有 6 种，具体查看 api/enum.ts
  data?: any; // 仅当 type 为 RejectEnum.BizFailed 和 RejectEnum.NativeLoginFailed 时存在
  // 其中 RejectEnum.NativeLoginFailed 返回的是一个字符串，表示错误信息
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
      console.log('错误信息:', error);
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
                onPress: async () => {
                  await clearUserStorage();
                  redirect('/(guest)/academic-login');
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
                onPress: async () => {
                  await clearUserStorage();
                  redirect('/(guest)/academic-login');
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
          Alert.alert('提示', RejectEnum.InternalFailed + ': 网络错误或服务器异常，请稍后再试');
          // 这里可以触发一些额外的错误处理逻辑
          break;

        case RejectEnum.Timeout:
          console.error('请求超时:', error);
          Alert.alert('提示', RejectEnum.Timeout + ': 请求超时，请稍后再试');
          break;

        case RejectEnum.NetworkError:
          console.error('网络异常:', error);
          Alert.alert('提示', RejectEnum.NetworkError + ': 网络异常，程序目前无法连接教务处与服务器，请检查网络连接');
          break;

        case RejectEnum.NativeLoginFailed:
          console.error('本地登录异常:', error);
          Alert.alert('教务处响应错误', error.data);
          break;

        default:
          console.error('未知错误类型:', error);
          Alert.alert('错误', '发生未知错误，请稍后再试，或反馈至交流群');
          break;
      }
    },
    [redirect],
  );

  return { handleError };
};
