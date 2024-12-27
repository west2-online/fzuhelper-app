package com.west2online.nativerequest

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
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

        AsyncFunction("get") { url: String ->
            val urlConnection = URL(url).openConnection() as HttpURLConnection
            urlConnection.requestMethod = "GET"

            try {
                val responseCode = urlConnection.responseCode
                if (responseCode in 200..299) {
                    BufferedReader(
                        InputStreamReader(
                            urlConnection.inputStream,
                            StandardCharsets.UTF_8
                        )
                    ).use { reader ->
                        val content = StringBuilder()
                        var line: String?
                        while (reader.readLine().also { line = it } != null) {
                            content.append(line)
                        }
                        return@AsyncFunction content.toString() + " Android"
                    }
                } else {
                    return@AsyncFunction "请求失败，状态码: $responseCode"
                }
            } catch (e: Exception) {
                return@AsyncFunction "请求失败: ${e.message}"
            } finally {
                urlConnection.disconnect()
            }
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

            val responseCode = urlConnection.responseCode
            val responseMessage = StringBuilder()
            val result = mutableMapOf<String, Any>()
            try {
                result["status"] = responseCode
                if (responseCode in 200..299) {
                    BufferedReader(
                        InputStreamReader(
                            urlConnection.inputStream,
                            StandardCharsets.UTF_8
                        )
                    ).use { reader ->
                        var line: String?
                        while (reader.readLine().also { line = it } != null) {
                            responseMessage.append(line)
                        }
                    }
                    result["data"] = responseMessage.toString()
                } else {
                    result["data"] = ""
                }
                result["set-cookies"] =
                    urlConnection.headerFields["Set-Cookie"]?.joinToString("; ") ?: ""
            } catch (e: Exception) {
                result["error"] = "请求失败: ${e.message}"
            } finally {
                urlConnection.disconnect()
            }

            return@AsyncFunction result
        }
    }

}
