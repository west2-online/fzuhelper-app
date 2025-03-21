package com.helper.west2ol.fzuhelper

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import com.west2online.nativewidget.BuildConfig
import com.west2online.nativewidget.R

open class CourseScheduleWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        appWidgetIds.filter {
            appWidgetManager.getAppWidgetIds(ComponentName(context, this::class.java)).contains(it)
        }.forEach {
            val views = RemoteViews(context.packageName, R.layout.course_schedule_widget_provider)
            val intent = Intent()
            intent.setClassName(
                "com.helper.west2ol.fzuhelper",
                "com.helper.west2ol.fzuhelper" + ".MainActivity"
            )
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT + PendingIntent.FLAG_IMMUTABLE
            )
            views.setPendingIntentTemplate(R.id.schedule_root, pendingIntent)
            views.setOnClickPendingIntent(R.id.schedule_root, pendingIntent)

            val intent2 = Intent(context, CourseScheduleWidgetService::class.java).apply {
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, it)
                data = Uri.parse(toUri(Intent.URI_INTENT_SCHEME))
            }
            views.setRemoteAdapter(R.id.list_view, intent2)

            appWidgetManager.updateAppWidget(it, views)
            appWidgetManager.notifyAppWidgetViewDataChanged(it, R.id.list_view)

        }
    }
}