package com.helper.west2ol.fzuhelper

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.net.Uri
import android.widget.RemoteViews
import com.west2online.nativewidget.BuildConfig
import com.west2online.nativewidget.R

open class CourseScheduleWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        appWidgetIds.filter {
            appWidgetManager.getAppWidgetIds(ComponentName(context, this::class.java)).contains(it)
        }.forEach {
            updateCourseScheduleWidget(context, appWidgetManager, it)
        }
    }

    override fun onDeleted(context: Context, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            deleteWidgetConfig(context, appWidgetId, "background_alpha")
            deleteWidgetConfig(context, appWidgetId, "foreground_alpha")
            deleteWidgetConfig(context, appWidgetId, "foreground_alpha_mode")
        }
    }
}

internal fun updateCourseScheduleWidget(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int
) {
    val views = RemoteViews(context.packageName, R.layout.course_schedule_widget_provider)
    val intent = Intent()
    intent.setClassName(
        "com.helper.west2ol.fzuhelper",
        "com.helper.west2ol.fzuhelper" + ".MainActivity"
    )
    val pendingIntent = PendingIntent.getActivity(
        context,
        appWidgetId,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT + PendingIntent.FLAG_IMMUTABLE
    )
    val intent2 = Intent(context, CourseScheduleWidgetService::class.java).apply {
        putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
        data = Uri.parse(toUri(Intent.URI_INTENT_SCHEME))
    }
    views.apply {
        setPendingIntentTemplate(R.id.list_view, pendingIntent)
        setRemoteAdapter(R.id.list_view, intent2)
        setOnClickPendingIntent(R.id.container, pendingIntent)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            setFloat(
                R.id.top_shadow,
                "setAlpha",
                getInt(context, appWidgetId, "background_alpha", 80) / 100.0f
            )
            setFloat(
                R.id.container,
                "setAlpha",
                getInt(context, appWidgetId, "foreground_alpha", 100) / 100.0f
            )
        }
    }
    appWidgetManager.updateAppWidget(appWidgetId, views)
    appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetId, R.id.list_view)
}