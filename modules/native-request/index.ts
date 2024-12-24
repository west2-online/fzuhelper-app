// Import the native module. On web, it will be resolved to NativeRequest.web.ts
// and on native platforms to NativeRequest.ts
import NativeRequestModule from './src/NativeRequestModule';

export async function get(url: string) {
  return await NativeRequestModule.get(url);
}

export async function post(
  url: string,
  headers: Record<string, string>,
  formData: Record<string, string>,
) {
  // return await NativeRequestModule.post(url, headers, formData);
  return await NativeRequestModule.post(url, headers, formData);
}
