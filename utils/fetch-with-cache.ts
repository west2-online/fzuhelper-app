import { queryClient } from '@/components/query-provider';
import type { QueryKey } from '@tanstack/query-core';
import { toast } from 'sonner-native';

/**
 * 优先使用缓存数据，否则请求服务器
 * 此函数可以在纯逻辑中调用，参数意义与useApiRequest相同
 * @param queryKey - 查询键
 * @param queryFn - 查询函数
 * @param options - 选项
 */
export async function fetchWithCache<TQueryFnData>(
  queryKey: QueryKey,
  queryFn: (...args: any[]) => Promise<TQueryFnData>,
  options: {
    persist?: boolean;
    staleTime?: number;
    retry?: boolean | number;
  } = {},
): Promise<TQueryFnData> {
  const { persist = true, staleTime = 0, retry = false } = options;

  try {
    return await queryClient.fetchQuery({
      queryKey,
      queryFn,
      staleTime,
      retry,
      meta: { persist },
    });
  } catch (error) {
    // 请求失败时，尝试返回过期的缓存数据
    const cachedData = queryClient.getQueryData<TQueryFnData>(queryKey);
    if (cachedData) {
      toast.error('请求失败，将展示缓存数据。CacheKey: ' + queryKey);
      return cachedData;
    }

    // 如果没有任何缓存，抛出原始错误
    throw error;
  }
}
