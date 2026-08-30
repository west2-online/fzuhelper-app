import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

interface NativeResponse {
  status: number;
  data: number[] | ArrayBuffer;
  headers: Record<string, string>;
  error?: string;
}

interface NativeRequestSpec extends TurboModule {
  get(url: string, headers: { data: Record<string, string> }): Promise<NativeResponse>;
  post(
    url: string,
    headers: { data: Record<string, string> },
    formData: { data: Record<string, string> },
  ): Promise<NativeResponse>;
  postJSON(
    url: string,
    headers: { data: Record<string, string> },
    formData: { data: Record<string, string> },
  ): Promise<NativeResponse>;
}

export default TurboModuleRegistry.getEnforcing<NativeRequestSpec>('NativeRequest');
