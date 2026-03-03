package com.west2online.nativerequest

import com.google.gson.Gson
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import okhttp3.CookieJar
import okhttp3.FormBody
import okhttp3.Headers
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.security.SecureRandom
import java.security.cert.X509Certificate
import java.util.TreeMap
import java.util.concurrent.TimeUnit
import javax.net.ssl.SSLContext
import javax.net.ssl.SSLSocketFactory
import javax.net.ssl.X509TrustManager

class NativeRequestModule : Module() {
    // Each module class must implement the definition function. The definition consists of components
    // that describes the module's functionality and behavior.
    // See https://docs.expo.dev/modules/module-api for more details about available components.
    override fun definition() = ModuleDefinition {
        // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
        // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
        // The module will be accessible from `requireNativeModule('NativeRequest')` in JavaScript.
        Name("NativeRequest")

        val trustAllCerts = object : X509TrustManager {
            override fun checkClientTrusted(chain: Array<X509Certificate?>?, authType: String?) {
            }

            override fun checkServerTrusted(chain: Array<X509Certificate?>?, authType: String?) {}

            override fun getAcceptedIssuers(): Array<X509Certificate?> {
                return arrayOfNulls(0)
            }
        }

        val getSSLSocketFactory: SSLSocketFactory by lazy {

            val sslContext = SSLContext.getInstance("TLS")
            sslContext.init(
                null, arrayOf(trustAllCerts),
                SecureRandom()
            )
            sslContext.socketFactory
        }

        class StringMapper : Record {
            @Field
            val data: Map<String, String> = emptyMap()
        }

        class ResponseMapper : Record {
            @Field
            var status: Int = -1

            @Field
            var data: ByteArray = ByteArray(0)

            @Field
            var headers: Map<String, String> = emptyMap()

            @Field
            var error: String? = null
        }

        val client by lazy {
            OkHttpClient.Builder()
                .protocols(listOf(Protocol.HTTP_1_1)) // 设置禁用 HTTP2.0
                .sslSocketFactory(getSSLSocketFactory, trustAllCerts)
                .hostnameVerifier { _, _ -> true }
                .followRedirects(false)
                .followSslRedirects(false)
                .cookieJar(CookieJar.NO_COOKIES) // 设置禁用 Cookie
                .connectTimeout(10, TimeUnit.SECONDS) // 设置连接超时为 10 秒
                .readTimeout(10, TimeUnit.SECONDS)    // 设置读取超时为 10 秒
                .writeTimeout(10, TimeUnit.SECONDS)   // 设置写入超时为 10 秒
                .build()
        }

        AsyncFunction("get") { url: String, headers: StringMapper ->
            val requestBuilder = Request.Builder()
                .url(url)
                .get()

            headers.data.forEach { (key, value) ->
                requestBuilder.addHeader(key, value)
            }

            val request = requestBuilder.build()

            val resp = ResponseMapper()
            try {
                val response = client.newCall(request).execute()
                resp.status = response.code
                resp.headers = response.headers.toMergedMapCaseSensitive()
                resp.data = response.body?.bytes() ?: ByteArray(0)
            } catch (e: Exception) {
                resp.error = "请求失败: ${e.message}"
            }
            return@AsyncFunction resp
        }

        // 以表单形式传递数据的 post 方法
        AsyncFunction("post") { url: String, headers: StringMapper, formData: StringMapper ->
            val formBodyBuilder = FormBody.Builder()
            formData.data.forEach { (key, value) ->
                formBodyBuilder.add(key, value)
            }
            val formBody = formBodyBuilder.build()

            val requestBuilder = Request.Builder()
                .url(url)
                .post(formBody)

            headers.data.forEach { (key, value) ->
                requestBuilder.addHeader(key, value)
            }

            val request = requestBuilder.build()

            val resp = ResponseMapper()
            try {
                val response = client.newCall(request).execute()
                resp.status = response.code
                resp.headers = response.headers.toMergedMapCaseSensitive()
                resp.data = response.body?.bytes() ?: ByteArray(0)
            } catch (e: Exception) {
                resp.error = "请求失败: ${e.message}"
            }
            return@AsyncFunction resp
        }

        // 以 JSON 形式传递数据的 post 方法
        AsyncFunction("postJSON") { url: String, headers: StringMapper, formData: StringMapper ->
            val gson = Gson()
            val json = gson.toJson(formData.data) // 将 formData.data 转换为 JSON 字符串

            val jsonBody = json.toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())

            val requestBuilder = Request.Builder()
                .url(url)
                .post(jsonBody) // 使用 JSON 格式的请求体

            headers.data.forEach { (key, value) ->
                requestBuilder.addHeader(key, value)
            }

            val request = requestBuilder.build()

            val resp = ResponseMapper()
            try {
                val response = client.newCall(request).execute()
                resp.status = response.code
                resp.headers = response.headers.toMergedMapCaseSensitive()
                resp.data = response.body?.bytes() ?: ByteArray(0)
            } catch (e: Exception) {
                resp.error = "请求失败: ${e.message}"
            }
            return@AsyncFunction resp
        }
    }

    private fun Headers.toMergedMapCaseSensitive(): Map<String, String> {
        // 来自okhttp toMultimap方法，但不对name作转小写处理
        val result = TreeMap<String, MutableList<String>>(String.CASE_INSENSITIVE_ORDER)
        for (i in 0 until size) {
            val name = name(i)
            var values: MutableList<String>? = result[name]
            if (values == null) {
                values = ArrayList(2)
                result[name] = values
            }
            values.add(value(i))
        }
        // 相同的key，对value作拼接处理
        return result.mapValues { it.value.joinToString(", ") }
    }

}
