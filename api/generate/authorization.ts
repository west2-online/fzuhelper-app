/* eslint-disable */
// @ts-ignore
import * as API from './types';
import request from '../axios';

/** 连通性测试(含鉴权) 测试/api路由下接口能否被正确拦截一份过期Access-Token 供测试：eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjowLCJleHAiOjE3MDAxMTA5MjksImlhdCI6MTY5OTUwNjEyOSwiaXNzIjoid2VzdDItb25saW5lIn0.wk108E9cho0wb6dOU_jYQQN1_K0Z_XAh4-mrBzJcgn1nCgsSHJHn8D6RW5T6sDhl1jQdSCrkOeXqb7egFHXMCA GET /api/v1/jwch/ping https://apifox.com/web/project/3275694/apis/api-239422879-run */
export async function getApiV1JwchPing(options?: { [key: string]: unknown }) {
  return request<{ code: string; message: string }>('/api/v1/jwch/ping', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取 Token 通过在header中提供id和cookies来获取token GET /api/v1/login/access-token https://apifox.com/web/project/3275694/apis/api-239019172-run */
export async function getApiV1LoginAccessToken(options?: { [key: string]: unknown }) {
  return request<{ code: string; message: string }>('/api/v1/login/access-token', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 刷新 Token 通过在 header 中提供 refreshtoken（长期）  来刷新 accesstoken（短期） GET /api/v1/login/refresh-token https://apifox.com/web/project/3275694/apis/api-239019200-run */
export async function getApiV1LoginRefreshToken(options?: { [key: string]: unknown }) {
  return request<{ code: string; message: string }>('/api/v1/login/refresh-token', {
    method: 'GET',
    ...(options || {}),
  });
}
