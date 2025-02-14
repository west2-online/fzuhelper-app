package com.helper.west2ol.fzuhelper.dev

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import java.util.logging.Logger
import org.json.JSONException
import android.content.ComponentName
import android.util.Log

/**
 * Implementation of App Widget functionality.
 */
class NextClassWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        // There may be multiple widgets active, so update all of them
        appWidgetIds.filter {
            appWidgetManager.getAppWidgetIds(ComponentName(context, this::class.java)).contains(it)
        }.forEach {
            updateNextClassWidget(context, appWidgetManager, it)
        }
    }

    override fun onEnabled(context: Context) {
        // Enter relevant functionality for when the first widget is created
    }

    override fun onDisabled(context: Context) {
        // Enter relevant functionality for when the last widget is disabled
    }
}

internal fun updateNextClassWidget(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int
) {
    try {
        val views = RemoteViews(context.packageName, R.layout.next_class_widget_provider)

        getData(context)
//        val jsonData = context
//            .getSharedPreferences("${context.packageName}.widgetdata", Context.MODE_PRIVATE)
//            .getString("widgetdata", "{}")
//
//        val data = JSONObject(jsonData)
//
//        views.setTextViewText(R.id.appwidget_text, data.getString("message"))
//
//        // Instruct the widget manager to update the widget
//        appWidgetManager.updateAppWidget(appWidgetId, views)
    } catch (e: JSONException) {
    }
}

internal fun getData(context: Context) {
    // TODO: Implement logic to retrieve data from server and store in shared preferences
    val a=context.getSharedPreferences("${context.packageName}.widgetdata", Context.MODE_PRIVATE)
    val allEntries: Map<String, *> = a.all

    // 遍历所有数据
    for ((key, value) in allEntries) {
        Log.e("widget", "key: $key, value: $value")
    }
}
