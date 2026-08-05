import type { GetSignedLocationApiUrlResponse } from '@/types/location';
import request from './axios';

export const getSignedLocationApiUrl = (latitude: number, longitude: number) => {
  return request.post<GetSignedLocationApiUrlResponse>('/api/v1/common/signed-location-api-url', {
    location: `${longitude},${latitude}`,
  });
};
