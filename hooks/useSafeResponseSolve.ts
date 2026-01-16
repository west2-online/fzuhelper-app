import { RejectEnum } from '@/api/enum';
import { useRedirectWithoutHistory } from '@/hooks/useRedirectWithoutHistory';
import { logoutUser } from '@/lib/user';
import { type RejectError } from '@/types/reject-error';
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { toast } from 'sonner-native';

// 安全处理网络请求错误，在 api/axios.ts 中遇到错误时会抛出错误，之后会被这个函数捕获（捕获过程由每个页面请求逻辑实现）

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
        toast.error('发生未知错误，请稍后再试');
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
                  await logoutUser();
                  redirect('/(guest)/academic-login');
                },
              },
            ],
            { cancelable: false },
          );
          break;

        case RejectEnum.ReLoginFailed:
          console.error('重新登录时遇到问题');
          if (error.data === '用户名或密码错误') {
            Alert.alert(
              '自动登录失败',
              '用户名或密码错误，请检查后重新登录',
              [
                {
                  text: '确认',
                  onPress: async () => {
                    await logoutUser();
                    redirect('/(guest)/academic-login');
                  },
                },
              ],
              { cancelable: false },
            );
          } else {
            // 此处登录失败后不能直接清空用户信息，因为可能教务处临时崩溃，只能弹出警告
            // 同时，我们可能需要有一个醒目的 Banner 来提示用户当前与教务处离线
            toast.error(
              '自动重新登录失败，将使用缓存数据。可能原因：教务处服务器不可用。如需重新登录，请前往“我的”->“退出登录”。',
            );
          }
          break;

        case RejectEnum.BizFailed:
          // 静默处理"没有可用图片"错误
          if (
            typeof error.data === 'object' &&
            error.data !== null &&
            'message' in error.data &&
            error.data.message === '没有可用图片'
          ) {
            console.log('静默处理无可用图片的业务异常');
            break;
          }
          console.error('业务异常:', error.data);
          return error.data;

        case RejectEnum.InternalFailed:
          console.error('内部异常:', error.data);
          toast.error(`网络错误或服务器异常，请稍后再试（${RejectEnum.InternalFailed}）`);
          // 这里可以触发一些额外的错误处理逻辑
          break;

        case RejectEnum.Timeout:
          console.error('请求超时:', error);
          toast.error(`请求超时，请稍后再试（${RejectEnum.Timeout}）`);
          break;

        case RejectEnum.NetworkError:
          console.error('网络异常:', error);
          toast.error(`网络异常，请检查网络连接（${RejectEnum.NetworkError}）`);
          break;

        case RejectEnum.NativeLoginFailed:
          console.error('本地登录异常:', error);
          Alert.alert('登录错误', String(error.data));
          break;

        case RejectEnum.EvaluationNotFound:
          console.error('未完成评议:', error.data);
          Alert.alert('未完成评议', '需要先进行评议。请前往教务处完成评议后重试(或在工具箱->一键评议进行评议)');
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
