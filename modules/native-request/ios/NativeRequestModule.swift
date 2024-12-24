import ExpoModulesCore
import Alamofire

// 用于接收 JS 传递的 headers 和 formData 参数
struct StringMapper: Record {
    @Field var data: [String: String] = [:]
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

    AsyncFunction("get") { (url: String) in
      do {
        let response = await AF.request(url).serializingData().response

        // 检查请求状态
        guard let statusCode = response.response?.statusCode, (200...299).contains(statusCode) else {
          return "请求失败，状态码: \(response.response?.statusCode ?? -1)"
        }

        // 获取字符串内容
        if let data = response.data, let resultString = String(data: data, encoding: .utf8) {
            return resultString + " iOS"
        } else {
            return "没有数据"
        }
      } catch {
        return "请求失败: \(error)"
      }
    }

    AsyncFunction("post") { (url: String, headers: StringMapper, formData: StringMapper) in
      // 创建 Alamofire 的 Session，启用 HTTPCookieStorage
      let configuration = URLSessionConfiguration.af.default
      configuration.httpCookieStorage = HTTPCookieStorage.shared
      let session = Alamofire.Session(configuration: configuration)

      var result: [String: Any] = [:]
      do{

        let response = await session.request(url, method: .post, parameters: formData.data, encoder: URLEncodedFormParameterEncoder.default, headers: HTTPHeaders(headers.data)).serializingData().response

        result["status"] = response.response?.statusCode ?? -1 // 状态码, -1 表示没有获取到状态码
        result["data"] = String(data: response.data ?? Data(), encoding: .utf8) ?? "" // 数据内容
        result["set-cookies"] = response.response?.allHeaderFields["Set-Cookie"] ?? "" // Set-Cookie

        return result

      } catch {
        result["error"] = "请求失败: \(error)"
      }
    }
  }
}