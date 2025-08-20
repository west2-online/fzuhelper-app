import { queryClient } from '@/components/query-provider';
import type { QueryKey } from '@tanstack/query-core';
import { toast } from 'sonner-native';

/**
 * 优先使用缓存数据，否则请求服务器
 * 此函数可以在纯逻辑中调用，参数意义与useApiRequest相同
 * @param queryKey - 查询键
 * @param queryFn - 查询函数
 * @param option - 选项
 *   - staleTime - 缓存过期时间（毫秒），默认设置为 0 表示不缓存，如有则优先使用缓存
 *   - retry - 自动重试次数，默认不重试
 *   - persist - 是否存入 AsyncStorage 持久化，由于历史原因，默认为 true
 */
export async function fetchWithCache<TQueryFnData>(
  queryKey: QueryKey,
  queryFn: (...args: any[]) => Promise<TQueryFnData>,
  option: {
    persist?: boolean;
    staleTime?: number;
    retry?: boolean | number;
  } = {},
): Promise<TQueryFnData> {
  const { persist = true, staleTime = 0, retry = false } = option;

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
