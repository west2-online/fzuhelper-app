/* eslint-disable */
// @ts-ignore
import * as API from './types';
import request from '../axios';

/** GetImage get image GET /launch_screen/api/image */
export async function getLaunchScreenApiImage(
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.getLaunchScreenApiImageParams,
  options?: { [key: string]: unknown }
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
  }>('/launch_screen/api/image', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** ChangeImageProperty change image's properties PUT /launch_screen/api/image */
export async function putLaunchScreenApiImage(
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.putLaunchScreenApiImageParams,
  options?: { [key: string]: unknown }
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
  }>('/launch_screen/api/image', {
    method: 'PUT',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** CreateImage create launch_screen image POST /launch_screen/api/image */
export async function postLaunchScreenApiImage(
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.postLaunchScreenApiImageParams,
  body: {},
  image?: File,
  options?: { [key: string]: unknown }
) {
  const formData = new FormData();

  if (image) {
    formData.append('image', image);
  }

  Object.keys(body).forEach((ele) => {
    const item = (body as { [key: string]: any })[ele];

    if (item !== undefined && item !== null) {
      if (typeof item === 'object' && !(item instanceof File)) {
        if (item instanceof Array) {
          item.forEach((f) => formData.append(ele, f || ''));
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
  }>('/launch_screen/api/image', {
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

/** DeleteImage delete image DELETE /launch_screen/api/image */
export async function deleteLaunchScreenApiImage(
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.deleteLaunchScreenApiImageParams,
  options?: { [key: string]: unknown }
) {
  return request<{ code: string; message: string }>(
    '/launch_screen/api/image',
    {
      method: 'DELETE',
      params: {
        ...params,
      },
      ...(options || {}),
    }
  );
}

/** ChangeImage change image file PUT /launch_screen/api/image/img */
export async function putLaunchScreenApiImageImg(
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.putLaunchScreenApiImageImgParams,
  body: {},
  image?: File,
  options?: { [key: string]: unknown }
) {
  const formData = new FormData();

  if (image) {
    formData.append('image', image);
  }

  Object.keys(body).forEach((ele) => {
    const item = (body as { [key: string]: any })[ele];

    if (item !== undefined && item !== null) {
      if (typeof item === 'object' && !(item instanceof File)) {
        if (item instanceof Array) {
          item.forEach((f) => formData.append(ele, f || ''));
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
  }>('/launch_screen/api/image/img', {
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

/** AddImagePointTime add image point time GET /launch_screen/api/image/point */
export async function getLaunchScreenApiImagePoint(
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.getLaunchScreenApiImagePointParams,
  options?: { [key: string]: unknown }
) {
  return request<{ code: string; message: string }>(
    '/launch_screen/api/image/point',
    {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    }
  );
}

/** MobileGetImage get image by student_id and device GET /launch_screen/api/screen */
export async function getLaunchScreenApiScreen(
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.getLaunchScreenApiScreenParams,
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
  }>('/launch_screen/api/screen', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
