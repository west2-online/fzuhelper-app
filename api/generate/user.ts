/* eslint-disable */
// @ts-ignore
import * as API from './types';
import request from '../axios';

/** [测试用] 登录 因为后续传参都是设置为identifier 和 cookies，但正常途径不方便获取这两个参数。这个接口的作用就是帮忙自动登录一次教务处，以获取id 和 cookies本地发送一次这个接口请求后，后续接口都会自动填充 id 和 cookies，不需要手动填写 GET /api/v1/internal/user/login https://apifox.com/web/project/3275694/apis/api-219089646-run */
export async function getApiV1InternalUserLogin(
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.getApiV1InternalUserLoginParams,
  options?: { [key: string]: unknown }
) {
  return request<{
    code: string;
    message: string;
    data: { id: string; cookies: string[] };
  }>('/api/v1/internal/user/login', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取个人信息 后面如果有别的需求的话在返回字段接着添加，目前这些够了 GET /api/v1/jwch/user/info https://apifox.com/web/project/3275694/apis/api-109631149-run */
export async function getApiV1JwchUserInfo(options?: {
  [key: string]: unknown;
}) {
  return request<{
    code: string;
    message: string;
    data: {
      stu_id: string;
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

/** 验证码识别 POST /api/v1/user/validate-code https://apifox.com/web/project/3275694/apis/api-215763225-run */
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
