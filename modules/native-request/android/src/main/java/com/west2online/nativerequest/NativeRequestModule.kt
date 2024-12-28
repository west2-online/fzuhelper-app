package com.west2online.nativerequest

import androidx.annotation.Keep
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.security.cert.X509Certificate
import javax.net.ssl.*

class NativeRequestModule : Module() {
    // Each module class must implement the definition function. The definition consists of components
    // that describes the module's functionality and behavior.
    // See https://docs.expo.dev/modules/module-api for more details about available components.
    override fun definition() = ModuleDefinition {
        // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
        // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
        // The module will be accessible from `requireNativeModule('NativeRequest')` in JavaScript.
        Name("NativeRequest")


        fun createAllTrustingSSLContext(): SSLContext {
            val trustAllCerts = arrayOf<TrustManager>(object : X509TrustManager {
                override fun checkClientTrusted(
                    chain: Array<out X509Certificate>?,
                    authType: String?
                ) {
                }

                override fun checkServerTrusted(
                    chain: Array<out X509Certificate>?,
                    authType: String?
                ) {
                }

                override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf()
            })

            val sslContext = SSLContext.getInstance("TLS")
            sslContext.init(null, trustAllCerts, java.security.SecureRandom())
            return sslContext
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
            var headers: Map<String, List<String>> = emptyMap()

            @Field
            var error: String? = null
        }

        AsyncFunction("get") { url: String, headers: StringMapper ->
            val sslContext = createAllTrustingSSLContext()
            HttpsURLConnection.setDefaultSSLSocketFactory(sslContext.socketFactory)
            HttpsURLConnection.setDefaultHostnameVerifier { _, _ -> true }

            val urlConnection = URL(url).openConnection() as HttpURLConnection
            urlConnection.requestMethod = "GET"

            headers.data.forEach { (key, value) ->
                urlConnection.setRequestProperty(key, value)
            }

            val resp = ResponseMapper()
            try {
                val responseCode = urlConnection.responseCode
                resp.status = responseCode
                resp.headers = urlConnection.headerFields

                if (responseCode in 200..299) {
                    val inputStream = urlConnection.inputStream
                    resp.data = inputStream.readBytes()
                }
            } catch (e: Exception) {
                resp.error = "请求失败: ${e.message}"
            } finally {
                urlConnection.disconnect()
            }
            return@AsyncFunction resp
        }

        AsyncFunction("post") { url: String, headers: Map<String, String>, formData: Map<String, String> ->
            val sslContext = createAllTrustingSSLContext()
            HttpsURLConnection.setDefaultSSLSocketFactory(sslContext.socketFactory)
            HttpsURLConnection.setDefaultHostnameVerifier { _, _ -> true }

            val urlObj = URL(url)
            val urlConnection = urlObj.openConnection() as HttpURLConnection
            urlConnection.requestMethod = "POST"

            headers.forEach { (key, value) ->
                urlConnection.setRequestProperty(key, value)
            }

            urlConnection.doOutput = true
            urlConnection.doInput = true

            val postData = formData.entries.joinToString("&") {
                "${URLEncoder.encode(it.key, "UTF-8")}=${URLEncoder.encode(it.value, "UTF-8")}"
            }.encodeToByteArray()

            urlConnection.outputStream.use { outputStream ->
                outputStream.write(postData)
                outputStream.flush()
            }

            val resp = ResponseMapper()
            try {
                val responseCode = urlConnection.responseCode
                resp.status = responseCode
                resp.headers = urlConnection.headerFields

                if (responseCode in 200..299) {
                    val inputStream = urlConnection.inputStream
                    resp.data = inputStream.readBytes()
                }
            } catch (e: Exception) {
                resp.error = "请求失败: ${e.message}"
            } finally {
                urlConnection.disconnect()
            }
            return@AsyncFunction resp
        }

    }

}
