import AsyncStorage from '@react-native-async-storage/async-storage'; // 或者其他 AsyncStorage 的实现
import type { DefaultError, QueryClient, QueryKey } from '@tanstack/query-core';
import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query/src/types';
import { toast } from 'sonner-native';
import * as NativeStorageModule from '@/modules/native-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface CachedData<T> {
  data: T;
  timestamp: number;
}

// 这个 hooks 实现了一个简单的缓存机制
// 优先使用未过期的缓存数据，否则请求服务器并更新缓存
function usePersistedQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  {
    queryKey,
    queryFn,
    cacheTime = 6 * 60 * 60 * 1000, // 默认缓存 6 小时（单位：毫秒）
    timeout,
    ...options
  }: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
    cacheTime?: number;
    timeout?: number;
  },
  queryClient?: QueryClient,
) {
  const { enabled, ...otherOptions } = options;
  const androidPackage = Constants.expoConfig?.android?.package;

  return useQuery(
    {
      queryKey,
      queryFn: async (...res): Promise<TQueryFnData> => {
        if (typeof queryFn !== 'function') throw new Error('queryFn is required');

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

          if (Platform.OS === 'ios') {
            const json = JSON.stringify({ [cacheKey]: response });
            NativeStorageModule.setWidgetData(json);
          } else if (androidPackage) {
            const json = JSON.stringify(response);
            NativeStorageModule.setWidgetData(json, cacheKey ,androidPackage);
          } else {
            }

          return response;
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
      },
    },
    queryClient,
  );
}

export default usePersistedQuery;
