package com.helper.west2ol.fzuhelper.dev

import com.helper.west2ol.fzuhelper.R
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import android.util.Log
import android.content.ComponentName
import android.util.TypedValue.COMPLEX_UNIT_SP
import org.json.JSONObject
import org.json.JSONArray
import java.util.Calendar
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.ZoneOffset

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
    val views = RemoteViews(context.packageName, R.layout.next_class_widget_provider)

    val nextClass: ClassInfo? = null
    if (nextClass != null) {
        val name = nextClass.courseBean.kcName
            .let { if (it.length >= 13) it.substring(0, 11) + "..." else it }

        views.apply {
            setTextViewText(R.id.course_name, name)
            setTextViewTextSize(R.id.course_name, COMPLEX_UNIT_SP, 20f)
            setTextViewText(R.id.course_room, nextClass.courseBean.kcLocation)
            val section: String = nextClass.courseBean.kcNote.ifEmpty {
                "${nextClass.courseBean.kcStartTime}-${nextClass.courseBean.kcEndTime}节"
            }

            setTextViewText(
                R.id.course_weekday,
                "周${nextClass.courseBean.kcWeekend}"
            )
            setTextViewText(R.id.course_section, section)
            setTextViewText(R.id.course_week, "第${nextClass.week}周")
        }

    } else {
        views.apply {
            setTextViewText(R.id.course_name, "放假啦")
            setTextViewTextSize(R.id.course_name, COMPLEX_UNIT_SP, 30f)
            setTextViewText(R.id.course_room, null)
            setTextViewText(R.id.course_weekday, null)
            setTextViewText(R.id.course_section, null)
            setTextViewText(R.id.course_week, null)
        }
    }

    appWidgetManager.updateAppWidget(appWidgetId, views)
}


data class ClassTime(val weekday: Int, val section: Int)

data class ClassInfo(val week: Int, val courseBean: CourseBean)

data class CourseBean(
    var kcName: String = "",
    var kcLocation: String = "",
    var kcStartTime: Int = 0,
    var kcEndTime: Int = 0,
    var kcWeekend: Int = 0,
    var kcNote: String = "",
    var type: Int = 0
)
