import { JavaScriptInterface, CompleteHandler } from '@hzw/ohos-dsbridge';
import { rcp } from '@kit.RemoteCommunicationKit';
import { AsyncCallback, BusinessError } from '@kit.BasicServicesKit';
import { JSON } from '@kit.ArkTS';
import { http } from '@kit.NetworkKit';

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
  get(args: string, handler: CompleteHandler) {
    // url, { data: headers }
    const data = JSON.parse(args) as GetParams;
    console.log('GET ', args, data.url, data.headers)

    const options: http.HttpRequestOptions = {
      method: http.RequestMethod.GET,
      header: data.headers,
      connectTimeout: 10000,
      readTimeout: 10000,
      usingCache: false,
      remoteValidation: 'skip',
      expectDataType: http.HttpDataType.ARRAY_BUFFER,
      usingProtocol: http.HttpProtocol.HTTP1_1,
    }

    const httpRequest = http.createHttp()

    httpRequest.request(
      data.url,
      options,
      (err: BusinessError, data: http.HttpResponse) => {
        if (err) {
          console.error('请求失败:', JSON.stringify(err))
          const responseMapper=new ResponseMapper()
          responseMapper.error='请求失败:'+ JSON.stringify(err)
          httpRequest.destroy()
          handler.complete(responseMapper)
          return
        }

        // 处理成功响应
        console.log('状态码:', data.responseCode)
        console.log('响应头:', JSON.stringify(data.header))

        const responseMapper=new ResponseMapper()
        responseMapper.status=data.responseCode
        responseMapper.headers=data.header as Record<string, string>
        console.log('响应数据:', data.result)
        responseMapper.data=new Uint8Array(data.result as ArrayBuffer)

        httpRequest.destroy()

        handler.complete(responseMapper)

        httpRequest.destroy()
      }
    )

  }
}