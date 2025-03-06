import { WebParams } from '@/app/common/web';
import { router } from 'expo-router';

// 会统一在 URL 后面加上 id 参数，以及携带 jwchCookie，同时会先检查 Cookie 可用性
export function pushToWebViewJWCH(url: string, title: string | undefined = undefined) {
  const params: WebParams = {
    url: url,
    jwch: true,
    title: title, // 页面标题（可选）
  };

  router.push({
    pathname: '/common/web',
    params, // 传递参数
  });
}

export async function pushToWebViewNormal(url: string, title: string | undefined = undefined) {
  const params: WebParams = {
    url,
    title: title, // 页面标题（可选）
  };

  router.push({
    pathname: '/common/web',
    params, // 传递参数
  });
}

export async function replaceToWebViewJWCH(url: string, title: string | undefined = undefined) {
  const params: WebParams = {
    url: url,
    jwch: true,
    title: title, // 页面标题（可选）
  };

  router.replace({
    pathname: '/common/web',
    params, // 传递参数
  });
}

export async function replaceToWebViewNormal(url: string, title: string | undefined = undefined) {
  const params: WebParams = {
    url,
    title: title, // 页面标题（可选）
  };

  router.replace({
    pathname: '/common/web',
    params, // 传递参数
  });
}
