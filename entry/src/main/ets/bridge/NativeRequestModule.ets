import { JavaScriptInterface, CompleteHandler } from '@hzw/ohos-dsbridge';
import { rcp } from '@kit.RemoteCommunicationKit';
import { JSON } from '@kit.ArkTS';

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

      // 处理成功响应
      console.log('状态码:', response.statusCode);
      console.log('响应头:', JSON.stringify(response.headers));

      const responseMapper = new ResponseMapper();
      responseMapper.status = response.statusCode;
      responseMapper.headers = response.headers as Record<string, string>;

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
