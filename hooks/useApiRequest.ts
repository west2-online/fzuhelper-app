import { AxiosResponse } from 'axios';

import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { useQuery } from '@tanstack/react-query';
import { type UseQueryResult } from '@tanstack/react-query/src/types';

type ApiReturn<T> = AxiosResponse<{ code: string; message: string; data: T }>;
type ApiFunction<T, R> = (params: T) => Promise<ApiReturn<R>>;

/**
 * 用于简化 API 请求中的状态处理
 * @param apiRequest - API 请求函数，应当是 api/generate 中生成的请求函数，需返回 AxiosResponse<{ code, message, data }> 结构
 * @param params - API 请求参数对象
 * @param staleTime - （可选）缓存过期时间，设置为 0 表示不缓存
 *
 * @example 基础示例
 * // 使用 useMemo 包裹参数对象
 * const params = { ... };
 * const { data } = useApiRequest(fetchUserInfo, params);
 */
export default function useApiRequest<T, R>(
  apiRequest: ApiFunction<T, R>,
  params: T,
  staleTime: number = 5 * 60,
): UseQueryResult<R, any> {
  const { handleError } = useSafeResponseSolve(); // HTTP 请求错误处理
  return useQuery({
    queryKey: [params],
    queryFn: async ({ queryKey }) => {
      try {
        return (await apiRequest(queryKey[0])).data.data;
      } catch (err: any) {
        throw handleError(err);
      }
    },
    staleTime,
  });
}
