import { postApiV1CommonSignedLocationApiUrl } from '@/api/generate/common';
import type { AMapRegeoResponse, LocationInfo } from '@/types/location';

// 获取定位反解信息
export const fetchReverseGeocode = async (
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<AMapRegeoResponse | null> => {
  try {
    const response = await postApiV1CommonSignedLocationApiUrl({
      location: `${longitude},${latitude}`,
    });
    const signedResult = response.data;

    // 检查后端是否返回成功 (code: "10000" 表示成功)
    if (signedResult.code !== '10000') {
      throw new Error(signedResult.message);
    }

    const data = signedResult.data;
    const headers: Record<string, string> = data.headers;

    const fetchResponse = await fetch(data.signed_url, {
      headers: headers,
      signal,
    });

    if (!fetchResponse.ok) {
      throw new Error(`HTTP ${fetchResponse.status}`);
    }

    const amapData: AMapRegeoResponse = await fetchResponse.json();

    if (amapData.status !== '1') {
      throw new Error(amapData.info);
    }

    return amapData;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return null;
    }
    console.error('获取定位反解失败:', error);
    return null;
  }
};

// 构建定位信息对象
export const buildLocationInfo = (
  amapData: AMapRegeoResponse | null,
  latitude: number,
  longitude: number,
  error?: string,
): LocationInfo => {
  if (error || !amapData) {
    return {
      formattedAddress: '',
      province: '',
      city: '',
      district: '',
      township: '',
      street: '',
      streetNumber: '',
      cityCode: '',
      adCode: '',
      latitude,
      longitude,
      error: error || '获取定位信息失败',
    };
  }

  // 从 pois 中取第一个 POI
  const firstPoi = amapData.pois?.[0] || null;

  return {
    formattedAddress: firstPoi?.address || '',
    province: firstPoi?.pname || '',
    city: firstPoi?.cityname || '',
    district: firstPoi?.adname || '',
    township: '',
    street: firstPoi?.address || '',
    streetNumber: '',
    cityCode: '',
    adCode: '',
    latitude,
    longitude,
  };
};

// 只获取定位信息（不注入），供外部调用
export const fetchLocationInfo = async (
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<LocationInfo> => {
  try {
    const amapData = await fetchReverseGeocode(latitude, longitude, signal);
    return buildLocationInfo(amapData, latitude, longitude);
  } catch (error) {
    console.error('获取定位信息失败:', error);
    return buildLocationInfo(null, latitude, longitude, error instanceof Error ? error.message : '未知错误');
  }
};

// 使用 Haversine 公式，计算两点之间的距离（米）
export const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
