/* eslint-disable */
// @ts-ignore
import * as API from './types';
import request from '../axios';

/** 空教室查询 后端缓存7天内的数据，当天空教室数据每6小时更新一次，其余6天每天更新一次 GET /api/v1/common/classroom/empty */
export async function getApiV1CommonClassroomEmpty(
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.getApiV1CommonClassroomEmptyParams,
  options?: { [key: string]: unknown }
) {
  return request<{
    code: string;
    message: string;
    data: { build: string; location: string; capacity: string; type: string }[];
  }>('/api/v1/common/classroom/empty', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 考场查询 GET /api/v1/jwch/classroom/exam */
export async function getApiV1JwchClassroomExam(
  body: {
    /** 学期 202401 */
    term: string;
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

  return request<{
    code: string;
    message: string;
    data: {
      name: string;
      credit: string;
      teacher: string;
      location: string;
      date: string;
      time: string;
    }[];
  }>('/api/v1/jwch/classroom/exam', {
    method: 'GET',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    data: formData,
    ...(options || {}),
  });
}
