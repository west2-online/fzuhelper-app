package com.helper.west2ol.fzuhelper

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import android.util.Log
import android.content.ComponentName
import android.content.Intent
import android.util.TypedValue.COMPLEX_UNIT_SP
import androidx.annotation.Keep
import com.google.gson.Gson
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

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

    val intent = Intent()
    intent.setClassName(
        "com.helper.west2ol.fzuhelper",
        "com.helper.west2ol.fzuhelper.MainActivity"
    )
    val pendingIntent = PendingIntent.getActivity(
        context,
        0,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT + PendingIntent.FLAG_IMMUTABLE
    )
    views.setPendingIntentTemplate(R.id.root, pendingIntent)
    views.setOnClickPendingIntent(R.id.root, pendingIntent)

    val cacheCourseData: CacheCourseData
    var nextClass: ClassInfo? = null
    try {
        val jsonData = context
            .getSharedPreferences("${context.packageName}.widgetdata", Context.MODE_PRIVATE)
            .getString("widgetdata", "")
        if (jsonData != "") {
            cacheCourseData = Gson().fromJson(jsonData, CacheCourseData::class.java)
            nextClass = getNextClass(cacheCourseData)
//            Log.d("NextClassWidgetProvider", "Loaded widget data: $cacheCourseData")
        }
    } catch (e: Exception) {
        Log.e("NextClassWidgetProvider", "Failed to load widget data", e)
    }

    if (nextClass != null) {

        val name = nextClass.courseBean.name
            .let { if (it.length >= 13) it.substring(0, 11) + "..." else it }

        views.apply {
            setTextViewText(R.id.course_name, name)
            setTextViewTextSize(R.id.course_name, COMPLEX_UNIT_SP, 20f)
            setTextViewText(R.id.course_room, nextClass.courseBean.location)
            val section: String = nextClass.courseBean.remark.ifEmpty {
                "${nextClass.courseBean.startClass}-${nextClass.courseBean.endClass}节"
            }

            setTextViewText(
                R.id.course_weekday,
                "周${getWeekChinese(nextClass.courseBean.weekday)}"
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


// 返回下一节课程
fun getNextClass(cacheCourseData: CacheCourseData): ClassInfo? {
    val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.PRC)
    val startTime = sdf.parse(cacheCourseData.startDate)?.time ?: 0L
    val week = getWeeks(startTime, System.currentTimeMillis())
    val classTime = getNextClassTime(startTime)
    return searchNextClassIterative(cacheCourseData, week, classTime)
}

// 判断当前时间是一周的第几节课，返回下一节课的时间
fun getNextClassTime(startTime: Long): ClassTime {

    // 还未开学时，设置当前为周一第1节
    if (startTime > System.currentTimeMillis()) {
        return ClassTime(1, 1)
    }

    val d = Calendar.getInstance()
    val hour = d.get(Calendar.HOUR_OF_DAY)
    val minute = d.get(Calendar.MINUTE)

    val weekday = (d.get(Calendar.DAY_OF_WEEK) + 5) % 7 + 1

    val time = when {
        (hour < 8 || (hour == 8 && minute < 20)) -> 1
        (hour < 9 || (hour == 9 && minute < 15)) -> 2
        (hour < 10 || (hour == 10 && minute < 20)) -> 3
        (hour < 11 || hour == 11 && minute < 15) -> 4
        (hour < 14) -> 5
        (hour == 14 && minute < 55) -> 6
        (hour < 15 || hour == 15 && minute < 50) -> 7
        (hour < 16 || hour == 16 && minute < 45) -> 8
        (hour < 17 || hour < 19) -> 9
        (hour == 19 && minute < 55) -> 10
        (hour < 20 || hour == 20 && minute < 50) -> 11
        else -> 12
    }
    return ClassTime(weekday, time)

}

fun searchNextClassIterative(
    cacheCourseData: CacheCourseData,
    week: Int,
    classTime: ClassTime
): ClassInfo? {
    var currentWeek = week
    var currentWeekday = classTime.weekday
    var currentSection = classTime.section
    val courseBeans = (cacheCourseData.courseData?.values?.flatten()
        ?: emptyList()) + (cacheCourseData.examData?.values?.flatten()
        ?: emptyList())

    while (currentWeek <= cacheCourseData.maxWeek) {
        var foundExam: ExtendCourse? = null
        var foundOrdinary: ExtendCourse? = null

        for (course in courseBeans) {
            if (currentWeek in course.startWeek..course.endWeek
                && ((course.single && currentWeek % 2 == 1) || (course.double && currentWeek % 2 == 0))
                && currentWeekday == course.weekday
                && currentSection == course.startClass
            ) {
                when (course.type) {
                    1 -> {
                        foundExam = course
                    }

                    0 -> {
                        foundOrdinary = course
                    }
                }
            }
        }

        // 优先级：考试>自定义课程>教务处导入课程
        if (foundExam != null) {
            return ClassInfo(currentWeek, foundExam)
        } else if (foundOrdinary != null) {
            return ClassInfo(currentWeek, foundOrdinary)
        }

        // Move to the next section, day or week
        if (currentSection < 11) {
            currentSection++
        } else if (currentWeekday < 7) {
            currentWeekday++
            currentSection = 1
        } else {
            currentWeek++
            currentWeekday = 1
            currentSection = 1
        }
    }

    return null
}

fun getWeeks(startTime: Long, endTime: Long): Int {
    if (endTime < startTime) {
        return 1
    }
    val res = ((endTime - startTime) / (7 * 24 * 60 * 60 * 1000L) + 1).toInt()
    return if (res <= 0) {
        1
    } else res
}

fun getWeekChinese(i: Int): String {
    return when (i) {
        0 -> "日"
        1 -> "一"
        2 -> "二"
        3 -> "三"
        4 -> "四"
        5 -> "五"
        6 -> "六"
        7 -> "日"
        else -> "无"
    }
}

data class ClassTime(val weekday: Int, val section: Int)

data class ClassInfo(val week: Int, val courseBean: ExtendCourse)

/**
 * 课程扩展类，包含课程基本信息和额外属性
 */
@Keep
data class ExtendCourse(
//    val id: Int,                 // 课程唯一ID
//    val color: String,           // 课程颜色
//    val priority: Int,           // 优先级
    val type: Int,               // 课程类型（0=普通课程，1=考试）
    val name: String,            // 课程名称
//    val teacher: String,         // 教师姓名
    val location: String,        // 上课地点
    val startClass: Int,         // 开始节次
    val endClass: Int,           // 结束节次
    val startWeek: Int,          // 开始周次
    val endWeek: Int,            // 结束周次
    val weekday: Int,            // 星期几
    val single: Boolean,         // 是否单周
    val double: Boolean,         // 是否双周
//    val adjust: Boolean,         // 是否为调课
    val remark: String,          // 备注
//    val syllabus: String,        // 课程大纲
//    val lessonplan: String       // 教学计划
)

/**
 * 缓存课程数据类
 */
@Keep
data class CacheCourseData(
    val courseData: Map<Int, List<ExtendCourse>>?,   // 课程数据：星期几 -> 课程列表
    val examData: Map<Int, List<ExtendCourse>>?,     // 考试数据：星期几 -> 考试列表
    val startDate: String,                           // 学期开始日期：如2025-02-24
    val maxWeek: Int                                 // 最大周次
)