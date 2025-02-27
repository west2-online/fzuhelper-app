/* eslint-disable */
// @ts-ignore
import * as API from './types';
import request from '../axios';

/** 获取下载链接 GET /api/v1/paper/download */
export async function getApiV1PaperDownload(
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.getApiV1PaperDownloadParams,
  options?: { [key: string]: unknown }
) {
  return request<{ code: string; message: string; data: { url: string } }>(
    '/api/v1/paper/download',
    {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    }
  );
}

/** 获取文件列表 GET /api/v1/paper/list */
export async function getApiV1PaperList(
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.getApiV1PaperListParams,
  options?: { [key: string]: unknown }
) {
  return request<{
    code: string;
    message: string;
    data: { basePath: string; files: string[]; folders: string[] };
  }>('/api/v1/paper/list', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
