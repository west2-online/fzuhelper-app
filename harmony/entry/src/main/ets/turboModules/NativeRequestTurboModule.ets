import { rcp } from '@kit.RemoteCommunicationKit';
import { EtsUITurboModule } from '@rnoh/react-native-openharmony/ets';

interface StringMapContainer {
  data: Record<string, string>;
}

interface NativeResponse {
  status: number;
  data: number[];
  headers: Record<string, string>;
  error?: string;
}

export class NativeRequestTurboModule extends EtsUITurboModule {
  static readonly NAME: string = 'NativeRequest';

  get(url: string, headers: StringMapContainer): Promise<NativeResponse> {
    return this.request(url, 'GET', headers.data);
  }

  post(
    url: string,
    headers: StringMapContainer,
    formData: StringMapContainer,
  ): Promise<NativeResponse> {
    const encodedForm = Object.keys(formData.data)
      .map((key: string) => `${this.encodeFormPart(key)}=${this.encodeFormPart(formData.data[key])}`)
      .join('&');
    const requestHeaders = this.copyHeaders(headers.data);
    if (!this.hasHeader(requestHeaders, 'content-type')) {
      requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
    }
    return this.request(url, 'POST', requestHeaders, encodedForm);
  }

  postJSON(
    url: string,
    headers: StringMapContainer,
    formData: StringMapContainer,
  ): Promise<NativeResponse> {
    const requestHeaders = this.copyHeaders(headers.data);
    if (!this.hasHeader(requestHeaders, 'content-type')) {
      requestHeaders['Content-Type'] = 'application/json; charset=utf-8';
    }
    return this.request(url, 'POST', requestHeaders, JSON.stringify(formData.data));
  }

  private hasHeader(headers: Record<string, string>, expectedName: string): boolean {
    return Object.keys(headers).some((name: string) => name.toLowerCase() === expectedName);
  }

  private copyHeaders(headers: Record<string, string>): Record<string, string> {
    const result: Record<string, string> = {};
    Object.keys(headers).forEach((name: string) => {
      result[name] = headers[name];
    });
    return result;
  }

  private async request(
    url: string,
    method: rcp.HttpMethod,
    headers: Record<string, string>,
    body?: string,
  ): Promise<NativeResponse> {
    let session: rcp.Session | undefined = undefined;
    try {
      // API 20's NetworkKit client cannot disable redirects. RCP exposes the
      // required redirect policy and only persists cookies when a repository
      // is explicitly configured. A fresh session per call therefore matches
      // the Android/iOS no-redirect and no-cookie client policy.
      session = rcp.createSession({
        requestConfiguration: {
          transfer: {
            autoRedirect: false,
            timeout: {
              connectMs: 10_000,
              transferMs: 10_000,
              inactivityMs: 10_000,
            },
          },
          security: {
            remoteValidation: 'skip',
          },
        },
      });
      const requestHeaders = this.toRequestHeaders(headers);
      const request = new rcp.Request(url, method, requestHeaders, body);
      request.destination = 'array-buffer';
      const response = await session.fetch(request);
      const buffer = response.body ?? new ArrayBuffer(0);
      const view = new Uint8Array(buffer);
      const bytes: number[] = [];
      for (let index = 0; index < view.length; index += 1) {
        bytes.push(view[index]);
      }

      const responseHeaders: Record<string, string> = {};
      Object.keys(response.headers).forEach((name: string) => {
        const canonicalName = this.canonicalizeHeaderName(name);
        const rawValue = response.headers[name];
        if (Array.isArray(rawValue)) {
          responseHeaders[canonicalName] = rawValue.join(', ');
        } else if (typeof rawValue === 'string') {
          responseHeaders[canonicalName] = rawValue;
        }
      });

      return {
        status: response.statusCode,
        data: bytes,
        headers: responseHeaders,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : `${error}`;
      return { status: -1, data: [], headers: {}, error: `请求失败: ${message}` };
    } finally {
      try {
        session?.close();
      } catch (error) {
        // The response has already been materialized. A cleanup error must not
        // replace the real network result.
      }
    }
  }

  private encodeFormPart(value: string): string {
    return encodeURIComponent(value).replace(/%20/g, '+');
  }

  private toRequestHeaders(headers: Record<string, string>): rcp.RequestHeaders {
    const result: rcp.RequestHeaders = {};
    Object.keys(headers).forEach((name: string) => {
      result[name] = headers[name];
    });
    return result;
  }

  private canonicalizeHeaderName(name: string): string {
    const segments = name.toLowerCase().split('-');
    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index];
      segments[index] = segment.length > 0
        ? `${segment.substring(0, 1).toUpperCase()}${segment.substring(1)}`
        : segment;
    }
    return segments.join('-');
  }
}
