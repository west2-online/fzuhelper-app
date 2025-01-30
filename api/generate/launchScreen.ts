/* eslint-disable */
// @ts-ignore
import * as API from './types';
import request from '../axios';

/** AddImagePointTime add image point time GET /api/v1/launch-screen/image/point-time https://apifox.com/web/project/3275694/apis/api-225730374-run */
export async function getApiV1LaunchScreenImagePointTime(
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.getApiV1LaunchScreenImagePointTimeParams,
  options?: { [key: string]: unknown }
) {
  return request<{ code: string; message: string }>(
    '/api/v1/launch-screen/image/point-time',
    {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    }
  );
}

/** MobileGetImage get image by student_id and device GET /api/v1/launch-screen/screen https://apifox.com/web/project/3275694/apis/api-225730375-run */
export async function getApiV1LaunchScreenScreen(
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.getApiV1LaunchScreenScreenParams,
  options?: { [key: string]: unknown }
) {
  return request<{
    code: string;
    message: string;
    data: {
      id?: number;
      url?: string;
      href?: string;
      text?: string;
      type?: number;
      show_times?: number;
      point_times?: number;
      duration?: number;
      s_type?: number;
      frequency?: number;
      start_at?: number;
      end_at?: number;
      start_time?: number;
      end_time?: number;
      regex?: string;
    }[];
  }>('/api/v1/launch-screen/screen', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
