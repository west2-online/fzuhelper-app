// Import the native module. On web, it will be resolved to NativeRequest.web.ts
// and on native platforms to NativeRequest.ts
import NativeRequestModule from './src/NativeRequestModule';

// 返回格式为 { data: string, headers: Record<string, string> }
export async function get(url: string, headers: Record<string, string>) {
  const response = await NativeRequestModule.get(url, headers);
  if (response.error) {
    throw new Error(response.error);
  }
  return {
    data: response.data,
    headers: response.headers,
  };
}

// 返回格式为 { data: string, headers: Record<string, string> }
export async function post(
  url: string,
  headers: Record<string, string>,
  formData: Record<string, string>,
) {
  const response = await NativeRequestModule.post(url, headers, formData);
  if (response.error) {
    throw new Error(response.error);
  }
  return {
    data: response.data,
    headers: response.headers,
  };
}
