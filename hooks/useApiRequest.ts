import { AxiosResponse } from 'axios';

import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { useQuery } from '@tanstack/react-query';
import { type UseQueryResult } from '@tanstack/react-query/src/types';

type ApiReturn<T> = AxiosResponse<{ code: string; message: string; data: T }>;
type ApiFunction<T, R> = (params: T) => Promise<ApiReturn<R>>;

interface useApiRequestOption<TData> {
  staleTime?: number;
  enabled?: boolean;
  onSuccess?: (data: TData) => void;
  errorHandler?: (errorData: any) => any;
}

/**
 * 用于简化 API 请求中的状态处理
 * @param apiRequest - API 请求函数，应当是 api/generate 中生成的请求函数，需返回 AxiosResponse<{ code, message, data }> 结构
 * @param params - API 请求参数对象
 * @param option useApiRequestOption - 客户端请求选项 （可选）
 *   - staleTime - 缓存过期时间，默认为 5 分钟，设置为 0 表示不缓存
 *   - enabled - 是否自动发起请求，默认为 true
 *   - onSuccess - 查询成功时的回调函数
 *   - errorHandler - 自定义错误处理，接受 hooks/useSafeResponseSolve 中的错误处理结果后进一步处理，返回结果会覆盖原本返回的 error
 * @example 基础示例
 * // 使用 useMemo 包裹参数对象
 * const params = { ... };
 * const { data } = useApiRequest(fetchUserInfo, params);
 */
export default function useApiRequest<TParam, TReturn>(
  apiRequest: ApiFunction<TParam, TReturn>,
  params: TParam,
  option: useApiRequestOption<TReturn> = {},
): UseQueryResult<TReturn, any> {
  const { handleError } = useSafeResponseSolve(); // HTTP 请求错误处理
  return useQuery({
    // 此处把函数转换为 string 作为查询字符串的一部分，避免不同 api 的返回混在一起
    queryKey: [params, apiRequest.toString()],
    queryFn: async ({ queryKey }) => {
      try {
        return (await apiRequest(queryKey[0] as TParam)).data.data;
      } catch (err: any) {
        const errorData = handleError(err);
        if (option.errorHandler) {
          throw option.errorHandler(errorData);
        } else {
          throw errorData;
        }
      }
    },
    staleTime: option.staleTime ?? 5 * 60,
    enabled: option.enabled ?? true,
    select: data => {
      option.onSuccess?.(data);
      return data;
    },
  });
}
