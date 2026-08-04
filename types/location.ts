// 请求参数
export interface GetSignedLocationApiUrlRequest {
  location: string; // 格式: "经度,纬度"
}

// 基础响应
export interface BaseResp {
  code: number;
  message: string;
}

// 签名URL响应
export interface GetSignedLocationApiUrlResponse {
  base: BaseResp;
  signed_url: string;
  headers: Record<string, string>;
}

// 高德周边搜索响应
export interface AMapRegeoResponse {
  status: string; // "1" 表示成功
  info: string;
  infocode: string;
  count: string;
  pois?: Array<{
    id: string;
    name: string;
    type: string;
    address: string;
    location: string;
    pname: string;
    cityname: string;
    adname: string;
    distance: string;
  }>;
}

// 传给 injectJS 的数据格式
export interface LocationInfo {
  formattedAddress: string;
  province: string;
  city: string;
  district: string;
  township: string;
  street: string;
  streetNumber: string;
  cityCode: string;
  adCode: string;
  latitude: number;
  longitude: number;
  error?: string; // 错误信息
  raw?: any; // 原始数据
}

// 自定义错误类
export class LocationError extends Error {
  constructor(
    message: string,
    public code: 'PERMISSION_DENIED' | 'TIMEOUT' | 'API_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN',
  ) {
    super(message);
    this.name = 'LocationError';
  }
}
