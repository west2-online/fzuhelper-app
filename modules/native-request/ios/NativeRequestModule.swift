import ExpoModulesCore
import Alamofire

// 用于接收 JS 传递的 headers 和 formData 参数
struct StringMapper: Record {
    @Field var data: [String: String] = [:]
}

// 用于统一返回数据格式
struct ResponseMapper: Record {
  // 响应状态码
  @Field var status: Int = -1 // 默认为 -1
  // 数据内容
  @Field var data: Data? = nil // 默认为空，需要 SDK50+ 支持
  // 响应头
  @Field var headers: [AnyHashable: Any] = [:]
  // 错误信息
  @Field var error: String? = nil // 默认不存在错误
}

public class NativeRequestModule: Module {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('NativeRequest')` in JavaScript.
    Name("NativeRequest")

    AsyncFunction("get") { (url: String, headers: StringMapper) -> (ResponseMapper) in
      // 创建 Alamofire 的 Session，启用 HTTPCookieStorage
      let configuration = URLSessionConfiguration.af.default // 配置自定义 configuration，默认禁用了 HTTP2.0
      configuration.httpCookieStorage = nil // 禁用系统共享的 Cookie 存储
      configuration.timeoutIntervalForRequest = 10 // 设置请求超时为 10 秒
      configuration.timeoutIntervalForResource = 10 // 设置资源超时为 10 秒
      let session = Alamofire.Session(configuration: configuration, redirectHandler: NoRedirectHandler())

      var resp = ResponseMapper(status: -1, data: nil, headers: [:], error: nil)
      do {
        let response = await session.request(url, headers: HTTPHeaders(headers.data)).serializingData().response
        resp.status = response.response?.statusCode ?? -1
        resp.data = response.data
        resp.headers = response.response?.allHeaderFields ?? [:] // Headers
        return resp
      } catch {
        resp.error = "请求失败: \(error)"
        return resp
      }
    }

    AsyncFunction("post") { (url: String, headers: StringMapper, formData: StringMapper) -> (ResponseMapper) in
      // 创建 Alamofire 的 Session，启用 HTTPCookieStorage
      let configuration = URLSessionConfiguration.af.default // 配置自定义 configuration，默认禁用了 HTTP2.0
      configuration.httpCookieStorage = nil // 禁用系统共享的 Cookie 存储
      configuration.timeoutIntervalForRequest = 10 // 设置请求超时为 10 秒
      configuration.timeoutIntervalForResource = 10 // 设置资源超时为 10 秒
      let session = Alamofire.Session(configuration: configuration, redirectHandler: NoRedirectHandler())
      var resp = ResponseMapper(status: -1, data: nil, headers: [:], error: nil)
      do{
        let response = await session.request(url, method: .post, parameters: formData.data, encoder: URLEncodedFormParameterEncoder.default, headers: HTTPHeaders(headers.data)).serializingData().response
        resp.status = response.response?.statusCode ?? -1
        resp.data = response.data
        resp.headers = response.response?.allHeaderFields ?? [:]
        return resp
      } catch {
        resp.error = "请求失败: \(error)"
        return resp
      }
    }
  }
}

// 自定义 RedirectHandler 来避免自动重定向
class NoRedirectHandler: RedirectHandler {
    func task(_ task: URLSessionTask, willBeRedirectedTo request: URLRequest, for response: HTTPURLResponse, completion: @escaping (URLRequest?) -> Void) {
        // 如果状态码为 302，则阻止重定向
        if response.statusCode == 302 {
            completion(nil)
        } else {
            completion(request)
        }
    }
}
