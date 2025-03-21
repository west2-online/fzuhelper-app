package com.west2online.nativewidget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NativeWidgetModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("NativeWidget")

        Function("setWidgetData") { json: String, packageName: String ->
            getPreferences(packageName).edit().putString("widgetdata", json).commit()

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