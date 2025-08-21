import { AxiosResponse } from 'axios';

import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { toast } from 'sonner-native';

type ApiReturn<T> = AxiosResponse<{ code: string; message: string; data: T }>;
type ApiFunction<T, R> = (params: T) => Promise<ApiReturn<R>>;

interface useApiRequestOption<TParam> {
  staleTime?: number;
  enabled?: boolean;
  retry?: number;
  persist?: boolean;
  queryKey?: (string | TParam)[];
}

/**
 * API 请求中的状态处理，请求西二后端接口时使用
 * @param apiRequest - API 请求函数，应当是 api/generate 中生成的请求函数，需返回 AxiosResponse<{ code, message, data }> 结构
 * @param params - API 请求参数对象
 * @param option useApiRequestOption - 客户端请求选项 （可选）
 *   - staleTime - 缓存过期时间（毫秒），默认设置为 0 表示不缓存，如有则优先使用缓存
 *   - enabled - 是否自动发起请求，默认为 true
 *   - retry - 自动重试次数，默认不重试
 *   - persist - 是否存入 AsyncStorage 持久化，默认为 false，即内存缓存；启用时必须设置 queryKey
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
  option: useApiRequestOption<TParam> = {},
): UseQueryResult<TReturn, any> {
  const { handleError } = useSafeResponseSolve();
  const queryClient = useQueryClient();

  if (option.persist && !option.queryKey) {
    throw new Error('persist 启用时，请设置 queryKey，保证缓存稳定性');
  }

  const queryKey = option.queryKey ?? [params, apiRequest.toString()];

  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        return (await apiRequest(params)).data.data;
      } catch (err: any) {
        const errorData = handleError(err);

        // 请求失败时，尝试返回过期的缓存数据
        const cachedData = queryClient.getQueryData<TReturn>(queryKey);
        if (cachedData) {
          toast.error('请求失败，将展示缓存数据。CacheKey: ' + queryKey);
          return cachedData;
        }

        // 如果没有任何缓存，抛出错误
        throw { type: err.type, data: errorData };
      }
    },
    meta: {
      // 持久化处理逻辑见 components/query-provider.tsx
      persist: option.persist ?? false,
    },
    staleTime: option.staleTime ?? 0,
    enabled: option.enabled ?? true,
    retry: option.retry ?? false,
  });
}
