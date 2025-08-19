import { AxiosResponse } from 'axios';

import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

type ApiReturn<T> = AxiosResponse<{ code: string; message: string; data: T }>;
type ApiFunction<T, R> = (params: T) => Promise<ApiReturn<R>>;

interface useApiRequestOption<TData, TParam> {
  staleTime?: number;
  enabled?: boolean;
  retry?: number;
  persist?: boolean;
  queryKey?: (string | TParam)[];
  onSuccess?: (data: TData) => void;
}

/**
 * API 请求中的状态处理，请求西二后端接口时使用
 * @param apiRequest - API 请求函数，应当是 api/generate 中生成的请求函数，需返回 AxiosResponse<{ code, message, data }> 结构
 * @param params - API 请求参数对象
 * @param option useApiRequestOption - 客户端请求选项 （可选）
 *   - staleTime - 缓存过期时间（毫秒），默认为 5 分钟，设置为 0 表示不缓存
 *   - enabled - 是否自动发起请求，默认为 true
 *   - retry - 自动重试次数，默认不重试
 *   - persist - 是否存入 AsyncStorage 持久化，默认为 false，即内存缓存；启用时必须设置 queryKey
 *   - onSuccess - 查询成功时的回调函数
 * @returns UseQueryResult<TData, any> - 返回的查询结果对象，常用部分如下：
 *   - isFetching - 是否正在加载中
 *   - isError - 是否出错
 *   - refetch - 刷新函数
 *   - error - 错误对象
 *   - dataUpdatedAt - 数据最后更新时间戳
 * @example 基础示例
 * // 使用 useMemo 包裹参数对象
 * const params = { ... };
 * const { data } = useApiRequest(fetchUserInfo, params);
 */
export default function useApiRequest<TParam, TReturn>(
  apiRequest: ApiFunction<TParam, TReturn>,
  params: TParam = {} as TParam,
  option: useApiRequestOption<TReturn, TParam> = {},
): UseQueryResult<TReturn, any> {
  const { handleError } = useSafeResponseSolve(); // HTTP 请求错误处理

  if (option.persist && !option.queryKey) {
    throw new Error('persist 启用时，请设置 queryKey，保证缓存稳定性');
  }

  return useQuery({
    // 此处把函数转换为 string 作为查询字符串的一部分，避免不同 api 的返回混在一起
    queryKey: option.queryKey ?? [params, apiRequest.toString()],
    queryFn: async () => {
      try {
        return (await apiRequest(params)).data.data;
      } catch (err: any) {
        const errorData = handleError(err);
        // 抛出后，isError 变为 true，且本次结果不会被缓存
        throw errorData;
      }
    },
    meta: {
      // 持久化处理逻辑见 components/query-provider.tsx
      persist: option.persist ?? false,
    },
    staleTime: option.staleTime ?? 0,
    enabled: option.enabled ?? true,
    retry: option.retry ?? false,
    select: data => {
      option.onSuccess?.(data);
      return data;
    },
  });
}
