import type { LocationInfo } from '@/types/location';
import { fetchAndSendLocation, getDistance } from '@/utils/location';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseLocationOptions {
  autoFetch?: boolean; // 是否自动获取位置
  webViewRef?: any; // WebView 引用
  onLocationReady?: (info: LocationInfo) => void; // 位置就绪回调
  targetLatitude?: number; // 签到点纬度
  targetLongitude?: number; // 签到点经度
  allowedDistance?: number; // 允许签到距离（米），默认100米
}

export const useLocation = (options: UseLocationOptions = {}) => {
  // 解构配置
  const {
    autoFetch = true,
    webViewRef,
    onLocationReady,
    targetLatitude,
    targetLongitude,
    allowedDistance = 100, // 默认100米
  } = options;

  // 状态管理
  const [loading, setLoading] = useState(false); // 是否加载中
  const [error, setError] = useState<string | null>(null); // 错误信息
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null); // 位置信息
  const [isInRange, setIsInRange] = useState<boolean | null>(null); // 是否在签到范围内（新增）

  // 用于防止内存泄漏
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 获取位置
  const getLocation = useCallback(async () => {
    // 如果正在加载中，直接返回
    if (loading) {
      console.log('定位请求进行中，忽略重复调用');
      return;
    }

    // 取消上一次未完成的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 创建新的取消控制器
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // 重置状态
    if (mountedRef.current) {
      setLoading(true);
      setError(null);
      setIsInRange(null);
    }

    try {
      // 检查定位权限
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        if (mountedRef.current) {
          setError('请开启定位权限才能签到');
        }
        return; // 没权限就结束
      }

      // 获取真实 GPS 位置
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 10000, // 可接受10秒前的缓存位置
        timeout: 15000, // 15秒超时
      });

      const { latitude, longitude } = currentLocation.coords;

      // 检查是否在签到范围内
      if (targetLatitude !== undefined && targetLongitude !== undefined) {
        const distance = getDistance(latitude, longitude, targetLatitude, targetLongitude);

        if (distance > allowedDistance) {
          if (mountedRef.current) {
            setIsInRange(false);
            setError(`你离签到点还有 ${Math.round(distance)} 米，需要 ${allowedDistance} 米内才能签到`);
          }
          return; // 不在范围内就结束
        }

        if (mountedRef.current) {
          setIsInRange(true); // 在范围内
        }
      }

      // 获取地址信息（反解）
      const info = await fetchAndSendLocation(latitude, longitude, webViewRef, abortController.signal);

      if (mountedRef.current) {
        setLocationInfo(info);
        onLocationReady?.(info);
      }
    } catch (err) {
      // 错误处理
      if (!mountedRef.current) return;

      // 如果是用户主动取消的请求，不处理
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      const errorMsg = err instanceof Error ? err.message : '定位失败';
      console.error('定位失败:', errorMsg);

      setError('定位失败，请检查 GPS 信号后重试');
    } finally {
      // 不管成功还是失败，都要关闭加载状态
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [loading, webViewRef, onLocationReady, targetLatitude, targetLongitude, allowedDistance]);

  // 组件挂载时自动获取位置
  useEffect(() => {
    mountedRef.current = true;

    if (autoFetch) {
      getLocation();
    }

    // 组件卸载时清理
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort(); // 取消正在进行的请求
      }
    };
  }, [autoFetch, getLocation]);

  return {
    loading,
    error,
    locationInfo,
    isInRange,
    getLocation,
  };
};
