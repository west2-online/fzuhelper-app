import { RejectEnum } from '@/api/enum';
import { STATE } from '@/components/multistateview/multi-state-view';
import { useEffect, useState } from 'react';
import { toast } from 'sonner-native';

interface UseMultiStateRequestOptions {
  /** 加载状态回调 */
  onLoading?: () => void;
  /** 网络错误回调 */
  onNoNetwork?: () => void;
  /** 接口错误回调 */
  onError?: (error: any) => void;
  /** 数据为空回调 */
  onEmpty?: () => void;
  /** 加载成功回调 */
  onContent?: (data: any) => void;

  /** 空状态判断，不传则始终当做不空 */
  emptyCondition?: (data: any) => boolean;
  /** 是否显示默认错误提示，默认true */
  showErrorToast?: boolean;
}

function useMultiStateRequest(
  apiResult: {
    data: any;
    isFetching: boolean;
    isError: boolean;
    error: any;
  },
  options: UseMultiStateRequestOptions = {},
) {
  const { onLoading, onNoNetwork, onError, onEmpty, onContent, emptyCondition, showErrorToast = true } = options;

  const [state, setState] = useState(STATE.LOADING);
  const { data, isFetching, isError, error } = apiResult;

  useEffect(() => {
    if (isFetching) {
      setState(STATE.LOADING);
      onLoading?.();
    } else if (isError) {
      if (error.type === RejectEnum.NetworkError) {
        setState(STATE.NO_NETWORK);
        onNoNetwork?.();
      } else {
        setState(STATE.ERROR);
        onError?.(error.data);
      }
      if (showErrorToast && error.data?.message) {
        toast.error(error.data.message);
      }
    } else {
      // 检查是否为空状态
      const isEmpty = emptyCondition ? emptyCondition(data) : false;

      if (isEmpty) {
        setState(STATE.EMPTY);
        onEmpty?.();
      } else {
        setState(STATE.CONTENT);
        onContent?.(data);
      }
    }
  }, [
    isFetching,
    isError,
    error,
    data,
    emptyCondition,
    onLoading,
    onError,
    onEmpty,
    onContent,
    showErrorToast,
    onNoNetwork,
  ]);

  return {
    state,
    setState,
  };
}

export default useMultiStateRequest;
