package com.west2online.nativerequest

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import okhttp3.CookieJar
import okhttp3.FormBody
import okhttp3.OkHttpClient
import okhttp3.Protocol
import okhttp3.Request
import java.security.SecureRandom
import java.security.cert.X509Certificate
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
            var data: ByteArray? = null

            @Field
            var headers: Map<String, String> = emptyMap()

            @Field
            var error: String? = null
        }

        val client by lazy {
            OkHttpClient.Builder()
                .protocols(listOf(Protocol.HTTP_1_1)) // okhttp在HTTP2的情况下会把响应headers转为小写，禁用以保留原样
                .sslSocketFactory(getSSLSocketFactory, trustAllCerts)
                .hostnameVerifier { _, _ -> true }
                .followRedirects(false)
                .followSslRedirects(false)
                .cookieJar(CookieJar.NO_COOKIES)
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
                resp.headers = response.headers.toMap()
                resp.data = response.body.bytes()
            } catch (e: Exception) {
                resp.error = "请求失败: ${e.message}"
            }
            return@AsyncFunction resp
        }

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
                resp.headers = response.headers.toMap()
                resp.data = response.body.bytes()
            } catch (e: Exception) {
                resp.error = "请求失败: ${e.message}"
            }
            return@AsyncFunction resp
        }

    }

}
