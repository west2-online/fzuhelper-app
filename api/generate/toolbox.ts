/* eslint-disable */
// @ts-ignore
import * as API from './types';
import request from '../axios';

/** 获取工具箱云配置 https://west2-online.feishu.cn/wiki/VG4HwCQNFicf6iklNoRc8Yptn5c?from=from_copylink GET /api/v1/toolbox/config https://apifox.com/web/project/3275694/apis/api-355523396-run */
export async function getApiV1ToolboxConfig(
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.getApiV1ToolboxConfigParams,
  options?: { [key: string]: unknown }
) {
  return request<{
    code: string;
    message: string;
    data: {
      id: number;
      visible?: boolean;
      title?: string;
      icon?: string;
      type?: string;
      message?: string;
      extra?: Record<string, unknown>;
    }[];
  }>('/api/v1/toolbox/config', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
