import { CachedData } from '@/types/cache';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { QueryKey } from '@tanstack/query-core';
import { toast } from 'sonner-native';

// 优先使用缓存数据，否则请求服务器
// 这个函数可以直接调用
export async function fetchWithCache<TQueryFnData>(
  queryKey: QueryKey,
  queryFn: (...args: any[]) => Promise<TQueryFnData>,
  cacheTime: number,
): Promise<TQueryFnData> {
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
    const response = await queryFn();

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
      toast.error('目标请求失败，已使用过期缓存数据');
      return parsedData.data;
    }

    // 如果没有缓存，抛出错误
    throw error;
  }
}
