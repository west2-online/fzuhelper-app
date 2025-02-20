/* eslint-disable */
// @ts-ignore
import request from '../axios';
import * as API from './types';

/** 空教室查询 后端缓存7天内的数据，当天空教室数据每6小时更新一次，其余6天每天更新一次 GET /api/v1/common/classroom/empty https://apifox.com/web/project/3275694/apis/api-109631162-run */
export async function getApiV1CommonClassroomEmpty(
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.getApiV1CommonClassroomEmptyParams,
  options?: { [key: string]: unknown },
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

/** 考场查询 GET /api/v1/jwch/classroom/exam https://apifox.com/web/project/3275694/apis/api-109631163-run */
export async function getApiV1JwchClassroomExam(
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.getApiV1JwchClassroomExamParams,
  options?: { [key: string]: unknown },
) {
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
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
