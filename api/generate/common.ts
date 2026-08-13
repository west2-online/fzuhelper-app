/* eslint-disable */
// @ts-ignore
import * as API from './types';
import request from '../axios';

/** 获取贡献者列表 GET /api/v1/common/contributor */
export async function getApiV1CommonContributor(options?: {
  [key: string]: unknown;
}) {
  return request<{
    code: string;
    message: string;
    data: {
      fzuhelper_app: {
        name: string;
        avatar_url: string;
        url: string;
        contributions: number;
      }[];
      fzuhelper_server: {
        name: string;
        avatar_url: string;
        url: string;
        contributions: number;
      }[];
      jwch: {
        name: string;
        avatar_url: string;
        url: string;
        contributions: number;
      }[];
      yjsy: {
        name: string;
        avatar_url: string;
        url: string;
        contributions: number;
      }[];
    };
  }>('/api/v1/common/contributor', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取教务处通知 教务处教学通知查询接口 GET /api/v1/common/notice */
export async function getApiV1CommonNotice(
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.getApiV1CommonNoticeParams,
  options?: { [key: string]: unknown }
) {
  return request<{
    code: string;
    message: string;
    data: {
      notices: { title: string; url: string; date: string }[];
      total: number;
    };
  }>('/api/v1/common/notice', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取签名位置 API URL POST /api/v1/common/signed-location-api-url */
export async function postApiV1CommonSignedLocationApiUrl(
  body: {
    /** 经度,纬度 */
    location: string;
  },
  options?: { [key: string]: unknown }
) {
  return request<{
    code: string;
    message: string;
    data: { signed_url: string; headers: { 'User-Agent': string } };
  }>('/api/v1/common/signed-location-api-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 学期信息 GET /api/v1/terms/info */
export async function getApiV1TermsInfo(
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.getApiV1TermsInfoParams,
  options?: { [key: string]: unknown }
) {
  return request<{
    code: string;
    message: string;
    data: {
      term_id: string;
      term: string;
      school_year: string;
      events: { name: string; start_date: string; end_date: string }[];
    };
  }>('/api/v1/terms/info', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 学期列表 GET /api/v1/terms/list */
export async function getApiV1TermsList(options?: { [key: string]: unknown }) {
  return request<{
    code: string;
    message: string;
    data: {
      current_term: string;
      terms: {
        term_id: string;
        school_year: string;
        term: string;
        start_date: string;
        end_date: string;
      }[];
    };
  }>('/api/v1/terms/list', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取安卓版本更新信息 GET /api/v2/version/android */
export async function getApiV2VersionAndroid(options?: {
  [key: string]: unknown;
}) {
  return request<{
    code: string;
    message: string;
    data: {
      release: {
        version_code: string;
        version_name: string;
        force: boolean;
        changelog: string;
        url: string;
      };
      beta: {
        version_code: string;
        version_name: string;
        force: boolean;
        changelog: string;
        url: string;
      };
    };
  }>('/api/v2/version/android', {
    method: 'GET',
    ...(options || {}),
  });
}
