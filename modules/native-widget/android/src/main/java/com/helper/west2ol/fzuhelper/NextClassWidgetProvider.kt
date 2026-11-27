package com.helper.west2ol.fzuhelper

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.Log
import com.google.gson.Gson

/**
 * Implementation of App Widget functionality.
 */
open class NextClassWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
        // There may be multiple widgets active, so update all of them
        val ownIds = manager.getAppWidgetIds(ComponentName(context, javaClass))
        updateNextClassWidgets(context, manager, ids.filter { it in ownIds }.toIntArray())
    }

    override fun onAppWidgetOptionsChanged(context: Context, manager: AppWidgetManager, id: Int, options: Bundle) {
        updateNextClassWidgets(context, manager, intArrayOf(id))
    }

    override fun onDeleted(context: Context, ids: IntArray) {
        for (id in ids) {
            arrayOf("showAsSquare", "showRemarks", "previewTomorrow").forEach {
                deleteWidgetConfig(context, id, it)
            }
        }
    }

    override fun onDisabled(context: Context) {
        scheduleCourseWidgetUpdate(context, readCourseWidgetSnapshot(context).first)
    }
}

class CourseOverviewWidgetProvider : NextClassWidgetProvider()

private fun readCourseWidgetSnapshot(context: Context): Pair<CourseWidgetSnapshot?, String> {
    val json = getSharedPreference(context).getString("widgetdata", "").orEmpty()
    if (json.isEmpty()) return null to "请打开福uu同步课表"
    return try {
        val snapshot = Gson().fromJson(json, CourseWidgetCache::class.java).widgetSnapshot
        snapshot?.takeIf { it.version == 2 } to "请打开福uu同步课表"
    } catch (error: Exception) {
        Log.e("CourseWidget", "Failed to read widget data", error)
        null to "课表数据异常，请重新同步"
    }
}

internal fun updateNextClassWidgets(context: Context, manager: AppWidgetManager, ids: IntArray) {
    if (ids.isEmpty()) return
    // 同批组件共用一次数据读取和闹钟调度。
    val (snapshot, message) = readCourseWidgetSnapshot(context)
    ids.forEach { id ->
        doConfigMigration(context, id)
        val medium = manager.getAppWidgetInfo(id)?.provider?.className == CourseOverviewWidgetProvider::class.java.name
        val renderer = CourseWidgetRenderer(context, snapshot, message, id, medium)
        manager.updateAppWidget(id, renderer.render(manager.getAppWidgetOptions(id)))
    }
    scheduleCourseWidgetUpdate(context, snapshot)
}

private fun courseWidgetIds(context: Context): List<Int> {
    val manager = AppWidgetManager.getInstance(context)
    return listOf(NextClassWidgetProvider::class.java, CourseOverviewWidgetProvider::class.java).flatMap {
        manager.getAppWidgetIds(ComponentName(context, it)).toList()
    }
}

private fun scheduleCourseWidgetUpdate(context: Context, snapshot: CourseWidgetSnapshot?) {
    val alarm = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val pendingIntent = PendingIntent.getBroadcast(
        context, 72204, Intent(context, CourseWidgetUpdateReceiver::class.java),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    if (courseWidgetIds(context).isEmpty()) {
        alarm.cancel(pendingIntent)
        return
    }
    if (snapshot == null) {
        alarm.cancel(pendingIntent)
        return
    }
    // 非唤醒闹钟配合系统周期更新，设备休眠时允许延迟。
    alarm.set(AlarmManager.RTC, snapshot.nextChange(System.currentTimeMillis()), pendingIntent)
}

class CourseWidgetUpdateReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val manager = AppWidgetManager.getInstance(context)
        updateNextClassWidgets(context, manager, courseWidgetIds(context).toIntArray())
    }
}
