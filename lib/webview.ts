import { router, type Href } from 'expo-router';

import type { WebParams } from '@/app/common/web';

export function getWebViewHref(params: WebParams): Href {
  return {
    pathname: '/common/web',
    params, // 传递参数
  };
}

export function getWebViewHrefJWCH(url: string, title: string | undefined = undefined): Href {
  const params: WebParams = {
    url: url,
    jwch: true,
    title: title, // 页面标题（可选）
  };

  return getWebViewHref(params);
}

export function getWebViewHrefNormal(url: string, title: string): Href {
  const params: WebParams = {
    url,
    title: title, // 页面标题（可选）
  };

  return getWebViewHref(params);
}

// 会统一在 URL 后面加上 id 参数，以及携带 jwchCookie，同时会先检查 Cookie 可用性
export function pushToWebViewJWCH(url: string, title: string | undefined = undefined) {
  router.push(getWebViewHrefJWCH(url, title));
}

export async function pushToWebViewNormal(url: string, title: string) {
  router.push(getWebViewHrefNormal(url, title));
}

export async function replaceToWebViewJWCH(url: string, title: string) {
  router.replace(getWebViewHrefJWCH(url, title));
}

export async function replaceToWebViewNormal(url: string, title: string) {
  router.replace(getWebViewHrefNormal(url, title));
}
