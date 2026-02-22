import Alamofire
import ExpoModulesCore

// 用于接收 JS 传递的 headers 和 formData 参数
struct StringMapper: Record {
  @Field var data: [String: String] = [:]
}

// 用于统一返回数据格式
struct ResponseMapper: Record {
  // 响应状态码
  @Field var status: Int = -1  // 默认为 -1
  // 数据内容
  @Field var data: Data = Data()  // 默认内容为空，需要 SDK50+ 支持
  // 响应头
  @Field var headers: [AnyHashable: Any] = [:]
  // 错误信息
  @Field var error: String? = nil  // 默认不存在错误
}

// 创建 Alamofire 的 Session，启用 HTTPCookieStorage
func build_session() -> Alamofire.Session {
  let configuration = URLSessionConfiguration.af.default  // 配置自定义 configuration，默认禁用了 HTTP2.0
  configuration.httpCookieStorage = nil  // 禁用系统共享的 Cookie 存储
  configuration.timeoutIntervalForRequest = 10  // 设置请求超时为 10 秒
  configuration.timeoutIntervalForResource = 10  // 设置资源超时为 10 秒
  let session = Alamofire.Session(
    configuration: configuration, redirectHandler: NoRedirectHandler())
  return session
}

// 教务处系统中对于包含中文的 URL 使用了 js 的 escape() 方法进行编码出 %uXXXX 格式
// swift 标准库不接受这种 url，在 swift6 以上构造 URL 会自动编码成 %25uXXXX 格式，但低版本则会直接构造 URL 失败
// 我们需要手动进行编码
func url_encode(url: String) -> URL? {
  guard let encoded = url.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) else {
    // 理论上不会编码失败，此处仅用于满足类型系统要求
    return nil
  }
  return URL(string: encoded)
}

func build_resp(data_response: DataResponse<Data, AFError>) -> ResponseMapper {
    var resp = ResponseMapper(status: -1, data: Data(), headers: [:], error: nil)
    if let error = data_response.error {
        // 检查是否是空响应体错误
        if let afError = error.asAFError,
            case .responseSerializationFailed(let reason) = afError,
            case .inputDataNilOrZeroLength = reason
        {
            // 情况1：是空响应体错误 → 忽略，继续执行后续代码
        } else {
            // 情况2：其他所有错误 → 处理错误
            resp.error = "请求失败: \(error)"
            return resp
        }
        // 情况3：没有错误或错误已被忽略 → 继续向下执行
    }
    // error 和 response 同时为 nil 的情况未知，此处防御性编程
    guard let response: HTTPURLResponse = data_response.response else {
        if let url = data_response.request?.url {
            resp.error = "请求失败: Alamofire 未报错但服务器无响应，无法连接到 \(url.absoluteString)"
        } else {
            resp.error = "请求失败: Alamofire 未报错但服务器无响应"
        }
        return resp
    }
    resp.status = response.statusCode
    resp.data = data_response.data ?? Data()  // 响应体为空时用空数组代替
    resp.headers = response.allHeaderFields
    return resp
}

// NativeRequest，负责发起网络请求，使用 Alamofire 库
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
      let session = build_session()
      var resp = ResponseMapper(status: -1, data: Data(), headers: [:], error: nil)
      let response = await session.request(url, headers: HTTPHeaders(headers.data))
        .serializingData().response
      return build_resp(data_response: response)
    }

    // 以表单形式传递数据的 post 方法
    AsyncFunction("post") {
      (url: String, headers: StringMapper, formData: StringMapper) -> (ResponseMapper) in
      let session = build_session()
      var resp = ResponseMapper(status: -1, data: Data(), headers: [:], error: nil)
      let response = await session.request(
        url, method: .post, parameters: formData.data,
        encoder: URLEncodedFormParameterEncoder.default, headers: HTTPHeaders(headers.data)
      )
      .serializingData().response
      return build_resp(data_response: response)
    }

    // 以 JSON 形式传递数据的 post 方法
    AsyncFunction("postJSON") {
      (url: String, headers: StringMapper, formData: StringMapper) -> (ResponseMapper) in
      let session = build_session()
      var resp = ResponseMapper(status: -1, data: Data(), headers: [:], error: nil)
      let response = await session.request(
        url, method: .post, parameters: formData.data, encoder: JSONParameterEncoder.default,
        headers: HTTPHeaders(headers.data)
      )
      .serializingData().response
      return build_resp(data_response: response)
    }
  }
}

// 自定义 RedirectHandler 来避免自动重定向
final class NoRedirectHandler: RedirectHandler {
  func task(
    _ task: URLSessionTask, willBeRedirectedTo request: URLRequest, for response: HTTPURLResponse,
    completion: @escaping (URLRequest?) -> Void
  ) {
    // 如果状态码为 302，则阻止重定向
    if response.statusCode == 302 {
      completion(nil)
    } else {
      completion(request)
    }
  }
}
