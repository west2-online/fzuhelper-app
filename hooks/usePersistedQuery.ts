import type { DefaultError, QueryClient, QueryKey } from '@tanstack/query-core';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import { fetchWithCache } from '@/utils/fetch-with-cache';

// 这个 hooks 实现了一个简单的缓存机制
// 优先使用未过期的缓存数据，否则请求服务器并更新缓存
function usePersistedQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TPostActionData = TQueryFnData, // 新增泛型参数，用于 postAction 的返回值
  TQueryKey extends QueryKey = QueryKey,
>(
  {
    queryKey,
    queryFn,
    cacheTime = 6 * 60 * 60 * 1000, // 默认缓存 6 小时（单位：毫秒）
    postAction, // 请求成功后的中间处理函数
    timeout,
    ...options
  }: Omit<UseQueryOptions<TQueryFnData, TError, TPostActionData, TQueryKey>, 'queryFn'> & {
    cacheTime?: number;
    timeout?: number;
    postAction?: (data: TQueryFnData) => TPostActionData; // postAction 返回 TPostActionData
    queryFn: (...args: any[]) => Promise<TQueryFnData>; // queryFn 返回 TQueryFnData
  },
  queryClient?: QueryClient,
) {
  const { enabled, ...otherOptions } = options;

  return useQuery<TQueryFnData, TError, TPostActionData, TQueryKey>(
    {
      queryKey,
      queryFn: async (...res): Promise<TQueryFnData> => {
        if (typeof queryFn !== 'function') {
          throw new Error('queryFn is required');
        }

        // 具体的缓存逻辑详见 @/utils/fetch-with-cache
        return fetchWithCache(queryKey, () => queryFn(...res), cacheTime);
      },
      ...{
        ...otherOptions,
        retry: false, // 禁用默认重试机制
        staleTime: Infinity, // 允许使用过期的数据
        select: postAction, // 使用 React Query 的 select 选项
      },
    },
    queryClient,
  );
}

export default usePersistedQuery;
