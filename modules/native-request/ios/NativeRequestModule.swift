import ExpoModulesCore
import Alamofire

// 用于接收 JS 传递的 headers 和 formData 参数
struct StringMapper: Record {
    @Field var data: [String: String] = [:]
}

// 用于统一返回数据格式
struct ResponseMapper: Record {
  // 数据内容
  @Field var data: String = ""
  // 响应头
  @Field var headers: [AnyHashable: Any] = [:]
  // 错误信息
  @Field var error: String = ""
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
      let configuration = URLSessionConfiguration.af.default
      configuration.httpCookieStorage = HTTPCookieStorage.shared
      let session = Alamofire.Session(configuration: configuration)

      var resp = ResponseMapper(data: "", headers: [:], error: "")
      do {
        let response = await session.request(url, headers: HTTPHeaders(headers.data)).serializingData().response
        // // 检查请求状态
        // guard let statusCode = response.response?.statusCode, (200...299).contains(statusCode) else {
        //     result["data"] = "请求失败，状态码: \(response.response?.statusCode ?? -1)"
        //     result["headers"] = response.response?.allHeaderFields ?? [:]
        //     return result
        // }
        resp.data = String(data: response.data ?? Data(), encoding: .utf8) ?? "" // 数据内容
        resp.headers = response.response?.allHeaderFields ?? [:] // Headers
        return resp
      } catch {
        resp.error = "请求失败: \(error)"
        return resp
      }
    }

    AsyncFunction("post") { (url: String, headers: StringMapper, formData: StringMapper) -> (ResponseMapper) in
      // 创建 Alamofire 的 Session，启用 HTTPCookieStorage
      let configuration = URLSessionConfiguration.af.default
      configuration.httpCookieStorage = HTTPCookieStorage.shared
      let session = Alamofire.Session(configuration: configuration)
      var resp = ResponseMapper(data: "", headers: [:], error: "")
      do{
        let response = await session.request(url, method: .post, parameters: formData.data, encoder: URLEncodedFormParameterEncoder.default, headers: HTTPHeaders(headers.data)).serializingData().response
        // // 检查请求状态
        // guard let statusCode = response.response?.statusCode, (200...299).contains(statusCode) else {
        //     result["data"] = "请求失败，状态码: \(response.response?.statusCode ?? -1)"
        //     result["headers"] = response.response?.allHeaderFields ?? [:]
        //     return result
        // }
        resp.data = String(data: response.data ?? Data(), encoding: .utf8) ?? "" // 数据内容
        resp.headers = response.response?.allHeaderFields ?? [:] // Headers
        return resp
      } catch {
        resp.error = "请求失败: \(error)"
        return resp
      }
    }
  }
}