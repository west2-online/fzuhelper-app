import { webview } from '@kit.ArkWeb';
import { BusinessError } from '@kit.BasicServicesKit';
import { WebViewControllerProxy } from '@hzw/ohos-dsbridge'
import { NativeRequestModule } from '../bridge/NativeRequestModule';
import { DEBUG } from 'BuildProfile';

@Entry
@Component
struct Index {
  controller: WebViewControllerProxy = WebViewControllerProxy.createController();
  PREFIX = 'https://fzuhelper.west2.online/local/'
  mimeTypeMap = new Map([
    ["html", 'text/html'],
    ["js", "text/javascript"],
    ["css", "text/css"],
    ["png", "image/png"],
    ["jpg", "image/jpeg"],
    ["jpeg", "image/jpeg"],
    ["webp", "image/webp"],
    ["gif", "image/gif"],
    ["ttf", "font/ttf"],
    ["ico", "image/x-icon"],
    ["woff", "font/woff"],
    ["woff2", "font/woff2"],
    ["json", "application/json"]
  ])

  aboutToAppear(): void {
    if (DEBUG) {
      try {
        // 配置Web开启无线调试模式，指定TCP Socket的端口。
        webview.WebviewController.setWebDebuggingAccess(true);
      } catch (error) {
        console.error(`ErrorCode: ${(error as BusinessError).code},  Message: ${(error as BusinessError).message}`);
      }
    }
    this.controller.addJavascriptObject(new NativeRequestModule(), 'NativeRequest')
  }

  build() {
    RelativeContainer() {
      Web({
        src: this.PREFIX,
        controller: this.controller.webviewController
      })
        .width('100%')
        .height('100%')
        .domStorageAccess(true)
        .javaScriptAccess(true)
        .javaScriptProxy(this.controller.javaScriptProxy)
        .fileAccess(true)
        .geolocationAccess(true)
        .horizontalScrollBarAccess(false)
        .mixedMode(MixedMode.All)
        .expandSafeArea([SafeAreaType.SYSTEM], [SafeAreaEdge.TOP, SafeAreaEdge.BOTTOM])
        .onInterceptRequest((event) => {
          if (!event) {
            return null
          }
          // 解决跨域，router.replace等问题
          const url = event.request.getRequestUrl()
          console.log("WEBVIEW INTERCEPT: " + url)
          if (url === this.PREFIX) {
            let response = new WebResourceResponse();
            response.setResponseData($rawfile('bundle/index.html'));
            response.setResponseEncoding('utf-8');
            response.setResponseMimeType('text/html');
            response.setResponseCode(200);
            response.setReasonMessage('OK');
            response.setResponseIsReady(true);
            console.log('returning homepage...')
            return response;
          }
          if (url.startsWith(this.PREFIX)) {
            let rawfileName: string = 'bundle/' + url.substring(this.PREFIX.length)
            console.log(rawfileName)
            let suffix = url.substring(url.lastIndexOf('.') + 1).toLowerCase()
            console.log(suffix)
            let mimeType = this.mimeTypeMap.get(suffix);
            if (typeof mimeType === 'string') {
              let response = new WebResourceResponse();
              response.setResponseData($rawfile(rawfileName));
              response.setResponseEncoding('utf-8');
              response.setResponseMimeType(mimeType);
              response.setResponseCode(200);
              response.setReasonMessage('OK');
              response.setResponseIsReady(true);
              console.log('returning...')
              return response;
            }
            console.error('Prefix match but fail to load')
          }
          return null
        })
        .onAlert((event) => {
          if (event) {
            console.log('event.url:' + event.url);
            console.log('event.message:' + event.message);
            const title = event.message.split('\n')[0];
            const text = event.message.split('\n', 2)[1];
            this.getUIContext().showAlertDialog({
              title: title,
              message: text,
              primaryButton: {
                value: 'cancel',
                action: () => {
                  event.result.handleCancel();
                }
              },
              secondaryButton: {
                value: 'ok',
                action: () => {
                  event.result.handleConfirm();
                }
              },
              cancel: () => {
                event.result.handleCancel();
              }
            })
          }
          return true;
        })
    }
    .height('100%')
    .width('100%')
  }

  onBackPress(): boolean | void {
    try {
      if (this.controller.webviewController.accessBackward()) {
        this.controller.webviewController.backward();
        return true;
      }
    } catch (error) {
      // TODO: Implement error handling.
    }
    return false;
  }
}