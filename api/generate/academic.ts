/* eslint-disable */
// @ts-ignore
import * as API from './types';
import request from '../axios';

/** 获取学分统计 注意这里可能涉及到辅修 GET /api/v1/jwch/academic/credit */
export async function getApiV1JwchAcademicCredit(options?: {
  [key: string]: unknown;
}) {
  return request<{
    code: string;
    message: string;
    data: { type: string; gain: string; total: string }[];
  }>('/api/v1/jwch/academic/credit', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 绩点排名 GET /api/v1/jwch/academic/gpa */
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

/** 获取专业培养计划 GET /api/v1/jwch/academic/plan */
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

/** 成绩详情 GET /api/v1/jwch/academic/scores */
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
      year: string;
    }[];
  }>('/api/v1/jwch/academic/scores', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 统考成绩 CET、省计算机 GET /api/v1/jwch/academic/unified-exam */
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
