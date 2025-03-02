/* eslint-disable */
// @ts-ignore
import * as API from './types';
import request from '../axios';

/** 个人信息 后面如果有别的需求的话在返回字段接着添加，目前这些够了 GET /api/v1/jwch/user/info https://apifox.com/web/project/3275694/apis/api-109631149-run */
export async function getApiV1JwchUserInfo(options?: {
  [key: string]: unknown;
}) {
  return request<{
    code: string;
    message: string;
    data: {
      stu_id: string;
      name: string;
      birthday: string;
      sex: string;
      college: string;
      grade: string;
      major: string;
    };
  }>('/api/v1/jwch/user/info', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 修改密码 PUT /api/v1/jwch/user/info https://apifox.com/web/project/3275694/apis/api-109631150-run */
export async function putApiV1JwchUserInfo(
  body: {
    /** 原密码 */
    original: string;
    /** 新密码 */
    new: string;
  },
  options?: { [key: string]: unknown }
) {
  const formData = new FormData();

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

  return request<{ code: string; message: string }>('/api/v1/jwch/user/info', {
    method: 'PUT',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    data: formData,
    ...(options || {}),
  });
}

/** 验证码自动识别 POST /api/v1/user/validate-code https://apifox.com/web/project/3275694/apis/api-215763225-run */
export async function postApiV1UserValidateCode(
  body: {
    /** 验证码图片的base64 */
    image: string;
  },
  options?: { [key: string]: unknown }
) {
  const formData = new FormData();

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

  return request<{ code: string; message: string; data: string }>(
    '/api/v1/user/validate-code',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      data: formData,
      ...(options || {}),
    }
  );
}
