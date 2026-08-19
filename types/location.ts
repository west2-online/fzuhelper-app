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
  error?: string;
  raw?: any;
}
