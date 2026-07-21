import { getSignedLocationApiUrl } from '@/api/location';
import type { AMapRegeoResponse, LocationInfo } from '@/types/location';
import { LocationError } from '@/types/location';

//获取定位反解信息
export const fetchReverseGeocode = async (
  latitude: number,
  longitude: number,
  signal?: AbortSignal, // 用于取消请求
): Promise<AMapRegeoResponse | null> => {
  try {
    // 调用后端获取签名URL
    const response = await getSignedLocationApiUrl(latitude, longitude);
    const signedResult = response.data;

    // 检查后端是否返回成功
    if (signedResult.base.code !== 0) {
      throw new LocationError(signedResult.base.message, 'API_ERROR');
    }

    const headers: Record<string, string> = signedResult.headers;

    // 用签名URL去请求高德API
    const fetchResponse = await fetch(signedResult.signed_url, {
      headers: headers,
      signal, // 支持取消请求
    });

    if (!fetchResponse.ok) {
      throw new LocationError(`HTTP ${fetchResponse.status}`, 'NETWORK_ERROR');
    }

    const amapData: AMapRegeoResponse = await fetchResponse.json();

    if (amapData.status !== '1') {
      throw new LocationError(amapData.info, 'API_ERROR');
    }

    return amapData;
  } catch (error) {
    // 如果是用户主动取消的请求，静默返回
    if (error instanceof Error && error.name === 'AbortError') {
      return null;
    }
    console.error('获取定位反解失败:', error);
    return null;
  }
};

//构建定位信息对象
export const buildLocationInfo = (
  amapData: AMapRegeoResponse | null,
  latitude: number,
  longitude: number,
  error?: string,
): LocationInfo => {
  // 如果有错误或没有数据，返回带错误信息的空对象
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

  return {
    formattedAddress: amapData.regeocode.formatted_address,
    province: amapData.regeocode.addressComponent.province,
    city: amapData.regeocode.addressComponent.city,
    district: amapData.regeocode.addressComponent.district,
    township: amapData.regeocode.addressComponent.township,
    street: amapData.regeocode.addressComponent.street,
    streetNumber: amapData.regeocode.addressComponent.streetNumber,
    cityCode: amapData.regeocode.addressComponent.citycode,
    adCode: amapData.regeocode.addressComponent.adcode,
    latitude,
    longitude,
  };
};

//发送定位信息给 WebView 的 injectJS
export const sendLocationToWebView = (locationInfo: LocationInfo, webViewRef: any) => {
  // 兼容两种传法：ref对象 或 直接传webview实例
  const webView = webViewRef?.current || webViewRef;

  if (!webView) {
    console.warn('WebView ref 为空');
    return;
  }

  if (typeof webView.injectJavaScript !== 'function') {
    console.warn('WebView 不支持 injectJavaScript');
    return;
  }

  // 构造要执行的JS代码
  const jsCode = `
    if (typeof window.injectJS === 'function') {
      window.injectJS(${JSON.stringify(locationInfo)});
    } else {
      console.warn('injectJS 函数不存在');
    }
  `;

  webView.injectJavaScript(jsCode);
};

//完整的定位反解流程
export const fetchAndSendLocation = async (
  latitude: number,
  longitude: number,
  webViewRef?: any,
  signal?: AbortSignal,
) => {
  try {
    // 获取反解数据，传入 signal 用于取消请求
    const amapData = await fetchReverseGeocode(latitude, longitude, signal);

    // 构建定位信息
    if (!amapData) {
      const locationInfo = buildLocationInfo(null, latitude, longitude, '获取定位信息失败');
      if (webViewRef) sendLocationToWebView(locationInfo, webViewRef);
      return locationInfo;
    }

    const locationInfo = buildLocationInfo(amapData, latitude, longitude);

    // 发给 WebView
    if (webViewRef) sendLocationToWebView(locationInfo, webViewRef);

    return locationInfo;
  } catch (error) {
    console.error('定位流程失败:', error);
    const locationInfo = buildLocationInfo(
      null,
      latitude,
      longitude,
      error instanceof Error ? error.message : '未知错误',
    );
    if (webViewRef) sendLocationToWebView(locationInfo, webViewRef);
    return locationInfo;
  }
};

// 使用 Haversine 公式，计算两点之间的距离（米）
// 判断用户是否在签到范围内
export const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000; // 地球平均半径（米）

  // 将角度转为弧度
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
