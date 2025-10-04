/* eslint-disable */
// @ts-ignore
import * as API from './types';
import request from '../axios';

/** 学分统计 v2 GET /api/v2/jwch/academic/credit  https://app.apifox.com/link/project/3275694/apis/api-356737870*/
// 能够区分主修与辅修课程，且由 Server 统一负责总分与剩余分的计算
export async function getApiV2JwchAcademicCredit(options?: {
  [key: string]: unknown;
}) {
  return request<{
    code: string;
    message: string;
    data: {
      type: string;
      data: { key: string; value: string }[];
    }[];
  }>('/api/v2/jwch/academic/credit', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 绩点排名 GET /api/v1/jwch/academic/gpa https://apifox.com/web/project/3275694/apis/api-109631157-run */
export async function getApiV1JwchAcademicGpa(options?: {
  [key: string]: unknown;
}) {
  return request<{
    code: string;
    message: string;
    data: { time: string; data: { type: string; value: string }[] };
  }>('/api/v1/jwch/academic/gpa', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 培养计划 GET /api/v1/jwch/academic/plan https://apifox.com/web/project/3275694/apis/api-109631160-run */
export async function getApiV1JwchAcademicPlan(options?: {
  [key: string]: unknown;
}) {
  return request<{ code: string; message: string; data: string }>(
    '/api/v1/jwch/academic/plan',
    {
      method: 'GET',
      ...(options || {}),
    }
  );
}

/** 成绩详情 GET /api/v1/jwch/academic/scores https://apifox.com/web/project/3275694/apis/api-109631158-run */
export async function getApiV1JwchAcademicScores(options?: {
  [key: string]: unknown;
}) {
  return request<{
    code: string;
    message: string;
    data: {
      credit: string;
      gpa: string;
      name: string;
      score: string;
      teacher: string;
      term: string;
      exam_type: string;
      elective_type: string;
      classroom: string;
    }[];
  }>('/api/v1/jwch/academic/scores', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 统考成绩 CET、省计算机 GET /api/v1/jwch/academic/unified-exam https://apifox.com/web/project/3275694/apis/api-109631161-run */
export async function getApiV1JwchAcademicUnifiedExam(options?: {
  [key: string]: unknown;
}) {
  return request<{
    code: string;
    message: string;
    data: { name: string; score: string; term: string }[];
  }>('/api/v1/jwch/academic/unified-exam', {
    method: 'GET',
    ...(options || {}),
  });
}
