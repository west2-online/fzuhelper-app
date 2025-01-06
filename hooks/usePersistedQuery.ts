import AsyncStorage from '@react-native-async-storage/async-storage'; // 或者其他 AsyncStorage 的实现
import type { DefaultError, QueryClient, QueryKey } from '@tanstack/query-core';
import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query/src/types';

// 这个hooks获取error只有在没有缓存数据时会触发
function usePersistedQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  {
    queryKey,
    queryFn,
    timeout,
    ...options
  }: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
    timeout?: number;
  },
  queryClient?: QueryClient,
) {
  const { enabled, ...otherOptions } = options;

  return useQuery(
    {
      queryKey,
      queryFn: async (...res): Promise<TQueryFnData> => {
        if (typeof queryFn !== 'function') throw new Error('queryFn is required');
        const persistedData = await AsyncStorage.getItem(queryKey.join('__'));
        try {
          const response = await queryFn(...res);
          await AsyncStorage.setItem(queryKey.join('__'), JSON.stringify(response));
          return response;
        } catch (error) {
          console.error(error);
          if (persistedData) {
            return JSON.parse(persistedData) as Awaited<TQueryFnData>;
          }
          throw error;
        }
      },
      ...{
        ...otherOptions,
        retry: false, // 禁用默认重试机制，当网络请求失败时，直接返回缓存数据
        staleTime: Infinity, // 允许使用过期的数据
      },
    },
    queryClient,
  );
}

export default usePersistedQuery;
