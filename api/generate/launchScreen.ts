/* eslint-disable */
// @ts-ignore
import request from '../axios';
import * as API from './types';

/** GetImage get image GET /api/v1/launch-screen/image https://apifox.com/web/project/3275694/apis/api-225730370-run */
export async function getApiV1LaunchScreenImage(
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.getApiV1LaunchScreenImageParams,
  options?: { [key: string]: unknown },
) {
  return request<{
    code: string;
    message: string;
    data: {
      id: number;
      url: string;
      href: string;
      text: string;
      type: number;
      show_times: number;
      duration: number;
      s_type: number;
      frequency: number;
      start_at: number;
      end_at: number;
      start_time: number;
      end_time: number;
      regex: string;
    };
  }>('/api/v1/launch-screen/image', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** ChangeImage change image file PUT /api/v1/launch-screen/image https://apifox.com/web/project/3275694/apis/api-225730373-run */
export async function putApiV1LaunchScreenImage(
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.putApiV1LaunchScreenImageParams,
  body: {},
  image?: File,
  options?: { [key: string]: unknown },
) {
  const formData = new FormData();

  if (image) {
    formData.append('image', image);
  }

  Object.keys(body).forEach(ele => {
    const item = (body as { [key: string]: any })[ele];

    if (item !== undefined && item !== null) {
      if (typeof item === 'object' && !(item instanceof File)) {
        if (item instanceof Array) {
          item.forEach(f => formData.append(ele, f || ''));
        } else {
          formData.append(ele, JSON.stringify(item));
        }
      } else {
        formData.append(ele, item);
      }
    }
  });

  return request<{
    code: string;
    message: string;
    data: {
      id: number;
      url: string;
      href: string;
      text: string;
      type: number;
      show_times: number;
      duration: number;
      s_type: number;
      frequency: number;
      start_at: number;
      end_at: number;
      start_time: number;
      end_time: number;
      regex: string;
    };
  }>('/api/v1/launch-screen/image', {
    method: 'PUT',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    params: {
      ...params,
    },
    data: formData,
    ...(options || {}),
  });
}

/** CreateImage create launch_screen image POST /api/v1/launch-screen/image https://apifox.com/web/project/3275694/apis/api-225730371-run */
export async function postApiV1LaunchScreenImage(
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.postApiV1LaunchScreenImageParams,
  body: {},
  image?: File,
  options?: { [key: string]: unknown },
) {
  const formData = new FormData();

  if (image) {
    formData.append('image', image);
  }

  Object.keys(body).forEach(ele => {
    const item = (body as { [key: string]: any })[ele];

    if (item !== undefined && item !== null) {
      if (typeof item === 'object' && !(item instanceof File)) {
        if (item instanceof Array) {
          item.forEach(f => formData.append(ele, f || ''));
        } else {
          formData.append(ele, JSON.stringify(item));
        }
      } else {
        formData.append(ele, item);
      }
    }
  });

  return request<{
    code: string;
    message: string;
    data: {
      id: number;
      url: string;
      href: string;
      text: string;
      type: number;
      show_times: number;
      duration: number;
      s_type: number;
      frequency: number;
      start_at: number;
      end_at: number;
      start_time: number;
      end_time: number;
      regex: string;
    };
  }>('/api/v1/launch-screen/image', {
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    params: {
      ...params,
    },
    data: formData,
    ...(options || {}),
  });
}

/** DeleteImage delete image DELETE /api/v1/launch-screen/image https://apifox.com/web/project/3275694/apis/api-225730369-run */
export async function deleteApiV1LaunchScreenImage(
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.deleteApiV1LaunchScreenImageParams,
  options?: { [key: string]: unknown },
) {
  return request<{ code: string; message: string }>('/api/v1/launch-screen/image', {
    method: 'DELETE',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** AddImagePointTime add image point time GET /api/v1/launch-screen/image/point-time https://apifox.com/web/project/3275694/apis/api-225730374-run */
export async function getApiV1LaunchScreenImagePointTime(
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.getApiV1LaunchScreenImagePointTimeParams,
  options?: { [key: string]: unknown },
) {
  return request<{ code: string; message: string }>('/api/v1/launch-screen/image/point-time', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** ChangeImageProperty change image's properties PUT /api/v1/launch-screen/image/property https://apifox.com/web/project/3275694/apis/api-225730372-run */
export async function putApiV1LaunchScreenImageProperty(
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.putApiV1LaunchScreenImagePropertyParams,
  options?: { [key: string]: unknown },
) {
  return request<{
    code: string;
    message: string;
    data: {
      id: number;
      url: string;
      href: string;
      text: string;
      type: number;
      show_times: number;
      duration: number;
      s_type: number;
      frequency: number;
      start_at: number;
      end_at: number;
      start_time: number;
      end_time: number;
      regex: string;
    };
  }>('/api/v1/launch-screen/image/property', {
    method: 'PUT',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** MobileGetImage get image by student_id and device GET /api/v1/launch-screen/screen https://apifox.com/web/project/3275694/apis/api-225730375-run */
export async function getApiV1LaunchScreenScreen(
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.getApiV1LaunchScreenScreenParams,
  options?: { [key: string]: unknown },
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
