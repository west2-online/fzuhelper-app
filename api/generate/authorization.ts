/* eslint-disable */
// @ts-ignore
import * as API from './types';
import request from '../axios';

/** 测试拦截功能 测试/api路由下接口能否被正确拦截 GET /api/v1/jwch/ping */
export async function getApiV1JwchPing(options?: { [key: string]: unknown }) {
  return request<{ code: string; message: string }>('/api/v1/jwch/ping', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取 token 通过在header中提供id和cookies来获取token GET /api/v1/login/access-token */
export async function getApiV1LoginAccessToken(options?: {
  [key: string]: unknown;
}) {
  return request<{ code: string; message: string }>(
    '/api/v1/login/access-token',
    {
      method: 'GET',
      ...(options || {}),
    }
  );
}

/** 刷新 token 通过在 header 中提供 refreshtoken（长期）  来刷新 accesstoken（短期） GET /api/v1/login/refresh-token */
export async function getApiV1LoginRefreshToken(options?: {
  [key: string]: unknown;
}) {
  return request<{ code: string; message: string }>(
    '/api/v1/login/refresh-token',
    {
      method: 'GET',
      ...(options || {}),
    }
  );
}
