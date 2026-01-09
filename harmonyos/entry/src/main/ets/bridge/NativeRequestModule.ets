import { CompleteHandler, JavaScriptInterface } from '@hzw/ohos-dsbridge';
import { rcp } from '@kit.RemoteCommunicationKit';
import { JSON, util } from '@kit.ArkTS';

class ResponseMapper {
  status: number = -1
  data: Uint8Array | null = null
  headers: Record<string, string> = {}
  error: string | null = null
}

interface GetParams {
  url: string;
  headers: Record<string, string>;
}

interface PostParams {
  url: string;
  headers: Record<string, string>;
  formData: Record<string, string>;
}

// rcp 不支持指定HTTP1.1，这里通过令第一个字母和横杠后的字母为大写，保持和HTTP1.1一致的结果
// 同时将Header的值转为string
function processHeaders(headers: rcp.ResponseHeaders): Record<string, string> {
  return Object.keys(headers).reduce((acc, key) => {
    const newKey =
      key.charAt(0).toUpperCase() + key.slice(1).replace(/-([a-z])/g, (_, letter: string) => `-${letter.toUpperCase()}`)
    let value: string;
    if (typeof headers[key] === 'string') {
      value = headers[key] as string;
    } else if (Array.isArray(headers[key])) {
      value = (headers[key] as string[]).join(',');
    } else {
      value = headers[key]?.toString() ?? '';
    }
    acc[newKey] = value
    return acc;
  }, {} as Record<string, string>);
}

function arrayBufferToString(data: ArrayBuffer | undefined): string {
  if (!data) {
    return ''
  }
  let decoder = util.TextDecoder.create('utf-8');
  let stringData = decoder.decodeToString(new Uint8Array(data));
  return stringData
}

// 为交互方便，可以把本类挪到index类
export class NativeRequestModule {
  // 异步get
  @JavaScriptInterface()
  async get(args: string, handler: CompleteHandler) {
    // url, { data: headers }
    const data = JSON.parse(args) as GetParams;
    console.log('GET ', args, data.url, data.headers)
    try {
      // 使用 rcp 创建请求
      const request = new rcp.Request(data.url, 'GET');
      request.headers = data.headers;

      // 配置请求选项
      request.configuration = {
        security: {
          remoteValidation: 'skip',
        },
        transfer: {
          autoRedirect: false,
          timeout: {
            connectMs: 10000,
            transferMs: 10000
          }
        },
      }

      // const sessionConfig: rcp.SessionConfiguration ={
      //   cacheControl:
      // }

      const session = rcp.createSession();

      const response: rcp.Response = await session.fetch(request);
      const headersCanonical = processHeaders(response.headers);

      // 处理成功响应
      console.log('状态码:', response.statusCode);
      console.log('响应头:', JSON.stringify(response.headers));
      console.log('响应头大小写敏感:', JSON.stringify(headersCanonical));

      const responseMapper = new ResponseMapper();
      responseMapper.status = response.statusCode;
      responseMapper.headers = headersCanonical;

      // 处理响应数据
      if (response.body) {
        responseMapper.data = new Uint8Array(response.body);
      }

      handler.complete(responseMapper);
    } catch (err) {
      console.error('请求失败:', JSON.stringify(err));
      const responseMapper = new ResponseMapper();
      responseMapper.error = '请求失败:' + JSON.stringify(err);
      handler.complete(responseMapper);
    }
  }

  @JavaScriptInterface()
  async post(args: string, handler: CompleteHandler) {
    // url, { data: headers }
    const data = JSON.parse(args) as PostParams;
    console.log('POST ', args, data.url, data.headers, data.formData)
    try {
      // 使用 rcp 创建请求
      const request = new rcp.Request(data.url, 'POST');
      request.headers = data.headers;

      const formFields: rcp.FormFields = data.formData;
      const form: rcp.Form = new rcp.Form(formFields);
      request.content = form;

      // 配置请求选项
      request.configuration = {
        security: {
          remoteValidation: 'skip',
        },
        transfer: {
          autoRedirect: false,
          timeout: {
            connectMs: 10000,
            transferMs: 10000
          }
        },
      }

      // const sessionConfig: rcp.SessionConfiguration ={
      //   cacheControl:
      // }

      const session = rcp.createSession();

      const response: rcp.Response = await session.fetch(request);
      const headersCanonical = processHeaders(response.headers);

      // 处理成功响应
      console.log('状态码:', response.statusCode);
      console.log('响应头:', JSON.stringify(response.headers));
      console.log('响应头大小写敏感:', JSON.stringify(headersCanonical));
      console.log('HTTP: ', response.httpVersion);
      console.log('响应体:', arrayBufferToString(response.body))

      const responseMapper = new ResponseMapper();
      responseMapper.status = response.statusCode;
      responseMapper.headers = headersCanonical;

      // 处理响应数据
      if (response.body) {
        responseMapper.data = new Uint8Array(response.body);
      }

      handler.complete(responseMapper);
    } catch (err) {
      console.error('请求失败:', JSON.stringify(err));
      const responseMapper = new ResponseMapper();
      responseMapper.error = '请求失败:' + JSON.stringify(err);
      handler.complete(responseMapper);
    }
  }
}
