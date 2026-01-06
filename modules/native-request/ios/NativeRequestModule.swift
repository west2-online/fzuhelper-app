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
  @Field var data: Data = Data() // 默认内容为空，需要 SDK50+ 支持
  // 响应头
  @Field var headers: [AnyHashable: Any] = [:]
  // 错误信息
  @Field var error: String? = nil // 默认不存在错误
}

// NativeRequest，负责发起网络请求，使用 Alamofire 库
// 请注意：对于几个方法，的确可以支持代码复用，但为了更好的可读性，这里分开实现
// 我们不能确定未来 iOS 开发者的水平，我们以最低要求为准
// 禁用 302 和 HTTP2.0 是为了教务处老旧接口的适配，这三个函数应该只适用于统一身份认证和教务系统的用户登录
// 而我们禁用系统共享的 Cookie 存储是为了避免 Cookie 污染，让前端接管 Cookie 管理
public class NativeRequestModule: Module {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    Name("NativeRequest")

    // get 方法，用于发起 GET 请求
    AsyncFunction("get") { (url: String, headers: StringMapper) -> (ResponseMapper) in
      // 创建 Alamofire 的 Session，启用 HTTPCookieStorage
      let configuration = URLSessionConfiguration.af.default // 配置自定义 configuration，默认禁用了 HTTP2.0
      configuration.httpCookieStorage = nil // 禁用系统共享的 Cookie 存储
      configuration.timeoutIntervalForRequest = 10 // 设置请求超时为 10 秒
      configuration.timeoutIntervalForResource = 10 // 设置资源超时为 10 秒
      let session = Alamofire.Session(configuration: configuration, redirectHandler: NoRedirectHandler())
      var resp = ResponseMapper(status: -1, data: Data(), headers: [:], error: nil)
      guard let url = url.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) else {
        resp.error = "无效的 URL\(url)"
        return resp
      }
      let result = await session.request(url, headers: HTTPHeaders(headers.data))
        .serializingData().response
      let response = result.response
      let error = result.error
      if let error = error {
        resp.error = "请求失败: \(error)"
        return resp
      }
      guard let response = result.response else {
          resp.error = "请求成功但响应不完整"
          return resp
      }
      resp.status = response.statusCode
      resp.data = result.data ?? Data()
      resp.headers = response.allHeaderFields
      return resp
    }

    // 以表单形式传递数据的 post 方法
    AsyncFunction("post") { (url: String, headers: StringMapper, formData: StringMapper) -> (ResponseMapper) in
      // 创建 Alamofire 的 Session，启用 HTTPCookieStorage
      let configuration = URLSessionConfiguration.af.default // 配置自定义 configuration，默认禁用了 HTTP2.0
      configuration.httpCookieStorage = nil // 禁用系统共享的 Cookie 存储
      configuration.timeoutIntervalForRequest = 10 // 设置请求超时为 10 秒
      configuration.timeoutIntervalForResource = 10 // 设置资源超时为 10 秒
      let session = Alamofire.Session(configuration: configuration, redirectHandler: NoRedirectHandler())
      var resp = ResponseMapper(status: -1, data: Data(), headers: [:], error: nil)
      guard let url = url.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) else {
        resp.error = "无效的 URL\(url)"
        return resp
      }
      let result = await session.request(url, method: .post, parameters: formData.data, encoder: URLEncodedFormParameterEncoder.default, headers: HTTPHeaders(headers.data))
        .serializingData().response
      let response = result.response
      let error = result.error
      if let error = error {
        resp.error = "请求失败: \(error)"
        return resp
      }
      guard let response = result.response else {
          resp.error = "请求成功但响应不完整"
          return resp
      }
      resp.status = response.statusCode
      resp.data = result.data ?? Data()
      resp.headers = response.allHeaderFields
      return resp
    }

    // 以 JSON 形式传递数据的 post 方法
    AsyncFunction("postJSON") { (url: String, headers: StringMapper, formData: StringMapper) -> (ResponseMapper) in
      // 创建 Alamofire 的 Session，启用 HTTPCookieStorage
      let configuration = URLSessionConfiguration.af.default // 配置自定义 configuration，默认禁用了 HTTP2.0
      configuration.httpCookieStorage = nil // 禁用系统共享的 Cookie 存储
      configuration.timeoutIntervalForRequest = 10 // 设置请求超时为 10 秒
      configuration.timeoutIntervalForResource = 10 // 设置资源超时为 10 秒
      let session = Alamofire.Session(configuration: configuration, redirectHandler: NoRedirectHandler())
      var resp = ResponseMapper(status: -1, data: Data(), headers: [:], error: nil)
      guard let url = url.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) else {
        resp.error = "无效的 URL\(url)"
        return resp
      }
      let result = await session.request(url, method: .post, parameters: formData.data, encoder: JSONParameterEncoder.default, headers: HTTPHeaders(headers.data))
        .serializingData().response
      let response = result.response
      let error = result.error
      if let error = error {
        resp.error = "请求失败: \(error)"
        return resp
      }
      guard let response = result.response else {
          resp.error = "请求成功但响应不完整"
          return resp
      }
      resp.status = response.statusCode
      resp.data = result.data ?? Data()
      resp.headers = response.allHeaderFields
      return resp
    }
  }
}

// 自定义 RedirectHandler 来避免自动重定向
final class NoRedirectHandler: RedirectHandler {
    func task(_ task: URLSessionTask, willBeRedirectedTo request: URLRequest, for response: HTTPURLResponse, completion: @escaping (URLRequest?) -> Void) {
        // 如果状态码为 302，则阻止重定向
        if response.statusCode == 302 {
            completion(nil)
        } else {
            completion(request)
        }
    }
}
