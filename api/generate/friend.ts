/* eslint-disable */
// @ts-ignore
import * as API from './types';
import request from '../axios';

/** 好友课表 GET /api/v1/friend/course https://apifox.com/web/project/3275694/apis/api-383320480-run */
export async function getApiV1FriendCourse(
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.getApiV1FriendCourseParams,
  options?: { [key: string]: unknown }
) {
  return request<{
    code: string;
    message: string;
    data: {
      name: string;
      teacher: string;
      scheduleRules: {
        location?: string;
        startClass?: number;
        endClass?: number;
        startWeek?: number;
        endWeek?: number;
        weekday?: number;
        single?: boolean;
        double?: boolean;
        adjust?: boolean;
      }[];
      remark: string;
      lessonplan: string;
      syllabus: string;
      rawScheduleRules: string;
      rawAdjust: string;
      examType: string;
      electiveType: string;
    }[];
  }>('/api/v1/friend/course', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 验证好友邀请码 POST /api/v1/user/friend/bind https://apifox.com/web/project/3275694/apis/api-383320348-run */
export async function postApiV1UserFriendBind(
  body: {
    invitation_code: string;
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

  return request<{ code: string; message: string }>(
    '/api/v1/user/friend/bind',
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

/** 解除好友关系 POST /api/v1/user/friend/delete https://apifox.com/web/project/3275694/apis/api-383320439-run */
export async function postApiV1UserFriendOpenApiDelete(
  body: {
    /** 想解绑的学生学号 */
    student_id: string;
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

  return request<{ code: string; message: string }>(
    '/api/v1/user/friend/delete',
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

/** 获取邀请码 GET /api/v1/user/friend/invite https://apifox.com/web/project/3275694/apis/api-383320216-run */
export async function getApiV1UserFriendInvite(
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.getApiV1UserFriendInviteParams,
  options?: { [key: string]: unknown }
) {
  return request<{
    code: string;
    message: string;
    data: { invitation_code: string; expire_at: number };
  }>('/api/v1/user/friend/invite', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 好友列表 GET /api/v1/user/friend/list https://apifox.com/web/project/3275694/apis/api-383320391-run */
export async function getApiV1UserFriendList(options?: {
  [key: string]: unknown;
}) {
  return request<{
    code: string;
    message: string;
    data: {
      stu_id: string;
      name: string;
      college: string;
      grade: string;
      major: string;
      created_at: number;
    }[];
  }>('/api/v1/user/friend/list', {
    method: 'GET',
    ...(options || {}),
  });
}
