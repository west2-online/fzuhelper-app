package com.west2online.nativebrightness

import android.util.Log
import android.view.WindowManager
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.URL

class NativeBrightnessModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("NativeBrightness")

        AsyncFunction("enableHighBrightness") {
            try {
                val activity = appContext.currentActivity
                if (activity == null) {
                    Log.d("NativeBrightnessModule", "Activity is null")
                    return@AsyncFunction null
                }
                activity.window.apply {
                    addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                    // 当前窗口亮度
                    // 范围为0~1.0,1.0时为最亮，-1为系统默认设置
                    attributes = attributes.apply {
                        screenBrightness = 1f
                    }
                }
                return@AsyncFunction null
            } catch (e: Exception) {
                Log.e("NativeBrightnessModule", e.stackTraceToString())
                return@AsyncFunction null
            }
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("disableHighBrightness") {
            val activity = appContext.currentActivity
            if (activity == null) {
                Log.d("NativeBrightnessModule", "Activity is null")
                return@AsyncFunction null
            }
            activity.window.apply {
                clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                attributes = attributes.apply {
                    screenBrightness = -1f
                }
            }
            return@AsyncFunction null
        }.runOnQueue(Queues.MAIN)
    }
}
