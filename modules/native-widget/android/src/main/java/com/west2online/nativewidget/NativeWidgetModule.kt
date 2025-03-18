package com.west2online.nativewidget

import android.util.Log
import android.content.Context
import android.content.SharedPreferences
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.content.Intent
import android.content.ComponentName
import android.appwidget.AppWidgetManager
import android.content.pm.PackageManager

class NativeWidgetModule : Module() {
    // Each module class must implement the definition function. The definition consists of components
    // that describes the module's functionality and behavior.
    // See https://docs.expo.dev/modules/module-api for more details about available components.
    override fun definition() = ModuleDefinition {
        // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
        // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
        // The module will be accessible from `requireNativeModule('NativeStorage')` in JavaScript.
        Name("NativeWidget")

        Function("setWidgetData") { json: String, cacheKey: String, packageName: String ->
            getPreferences(packageName).edit().putString(cacheKey, json).commit()
            Log.e("widget", "$cacheKey, $packageName, $json")

            val intent = Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE)
            val widgetManager = AppWidgetManager.getInstance(context)
            val widgetProviders = context.packageManager.queryBroadcastReceivers(
                Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE),
                PackageManager.GET_META_DATA
            )

            for (provider in widgetProviders) {
                if (provider.activityInfo.packageName == packageName) {
                    val providerComponent = ComponentName(
                        provider.activityInfo.packageName,
                        provider.activityInfo.name
                    )
                    val widgetIds = widgetManager.getAppWidgetIds(providerComponent)
                    intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, widgetIds)
                    context.sendBroadcast(intent)
                }
            }
        }
    }

    private val context
        get() = requireNotNull(appContext.reactContext)

    private fun getPreferences(packageName: String): SharedPreferences {
        return context.getSharedPreferences(packageName + ".widgetdata", Context.MODE_PRIVATE)
    }
}