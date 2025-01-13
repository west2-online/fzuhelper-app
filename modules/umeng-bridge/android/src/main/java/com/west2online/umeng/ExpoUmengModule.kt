package com.west2online.umeng

import android.content.Context
import android.content.SharedPreferences
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoUmengModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoUmeng")
    Function("deviceToken") {
      return@Function getPreferences().getString("deviceToken", "123")
    }

    Function("getMsg") {
      return@Function getPreferences().getString("msg", "{screen=test, time=100000000}")
    }
  }

  private val context
    get() = requireNotNull(appContext.reactContext)

  private fun getPreferences(): SharedPreferences {
    return context.getSharedPreferences("MyAppPreferences", Context.MODE_PRIVATE)
  }

}
