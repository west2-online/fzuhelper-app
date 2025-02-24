import { CachedData } from '@/types/cache';
import AsyncStorage from '@react-native-async-storage/async-storage'; // 或者其他 AsyncStorage 的实现
import type { DefaultError, QueryClient, QueryKey } from '@tanstack/query-core';
import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query/src/types';
import { toast } from 'sonner-native';

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

        const cacheKey = queryKey.join('__');
        const persistedData = await AsyncStorage.getItem(cacheKey);

        if (persistedData) {
          const parsedData: CachedData<TQueryFnData> = JSON.parse(persistedData);

          // 判断缓存是否过期
          const isCacheValid = Date.now() - parsedData.timestamp < cacheTime;

          if (isCacheValid) {
            return parsedData.data;
          }
        }

        // 如果没有缓存或缓存已过期，请求服务器
        try {
          const response = await queryFn(...res);

          // 缓存数据并存储时间戳
          const cacheToStore: CachedData<TQueryFnData> = {
            data: response,
            timestamp: Date.now(),
          };
          await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheToStore));

          return response; // 直接返回 queryFn 的结果
        } catch (error) {
          // 如果请求失败且有过期缓存，返回过期缓存
          if (persistedData) {
            const parsedData: CachedData<TQueryFnData> = JSON.parse(persistedData);
            toast.error('教务处访问失败，已使用过期缓存数据');
            return parsedData.data;
          }

          // 如果没有缓存，抛出错误
          throw error;
        }
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
