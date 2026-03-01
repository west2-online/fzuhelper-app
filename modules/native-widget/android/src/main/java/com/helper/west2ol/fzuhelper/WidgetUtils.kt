package com.helper.west2ol.fzuhelper

import android.app.AppOpsManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import android.util.Log
import androidx.annotation.Keep
import androidx.annotation.RequiresApi

/**
 * 课程扩展类，包含课程基本信息和额外属性
 */
@Keep
data class ExtendCourse(
//    val id: Int,                 // 课程唯一ID
    val color: String,           // 课程颜色
    val priority: Int,           // 优先级
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
//    val syllabus: String?,        // 课程大纲
//    val lessonplan: String?       // 教学计划
    val examType: String?,        // 考试类型
)

/**
 * 缓存课程数据类
 */
@Keep
data class CacheCourseData(
    val courseData: Map<Int, List<ExtendCourse>>?,  // 课程数据：星期几 -> 课程列表
    val examData: Map<Int, List<ExtendCourse>>?,    // 考试数据：星期几 -> 考试列表
    val customData: Map<Int, List<ExtendCourse>>?,  // 自定义课程数据：星期几 -> 课程列表
    val startDate: String,                          // 学期开始日期：如2025-02-24
    val maxWeek: Int,                               // 最大周次
    val showNonCurrentWeekCourses: Boolean?,        // 是否显示非当前周的课程
    val hiddenCoursesWithoutAttendances: Boolean?,  // 是否显示免听课程
)


fun getWeeks(startTime: Long, endTime: Long): Int {
    if (endTime < startTime) {
        return 1
    }
    val res = ((endTime - startTime) / (7 * 24 * 60 * 60 * 1000L) + 1).toInt()
    return if (res <= 0) {
        1
    } else res
}

fun getSharedPreference(context: Context): SharedPreferences {
    return context.getSharedPreferences("${context.packageName}.widgetdata", Context.MODE_PRIVATE)
}

fun getBoolean(context: Context, appWidgetId: Int, key: String, defaultValue: Boolean): Boolean {
    return getSharedPreference(context).getBoolean("$appWidgetId$key", defaultValue)
}

fun putBoolean(context: Context, appWidgetId: Int, key: String, value: Boolean) {
    getSharedPreference(context).edit().putBoolean("$appWidgetId$key", value).commit()
}

fun getInt(context: Context, appWidgetId: Int, key: String, defaultValue: Int): Int {
    return getSharedPreference(context).getInt("$appWidgetId$key", defaultValue)
}

fun putInt(context: Context, appWidgetId: Int, key: String, value: Int) {
    getSharedPreference(context).edit().putInt("$appWidgetId$key", value).commit()
}

fun deleteWidgetConfig(context: Context, appWidgetId: Int, key: String) {
    getSharedPreference(context).edit().remove("$appWidgetId$key").commit()
}

fun getCourseBeans(cacheCourseData: CacheCourseData): List<ExtendCourse> = try {
    ((cacheCourseData.courseData?.values?.flatten() ?: emptyList()).run {
        if (cacheCourseData.hiddenCoursesWithoutAttendances == true) {
            filter { it.examType?.contains("免听") == false }
        } else {
            sortedBy { it.examType?.contains("免听") == true }
        }
    } + (cacheCourseData.examData?.values?.flatten() ?: emptyList()) +
            (cacheCourseData.customData?.values?.flatten() ?: emptyList())).sortedBy {
        -(it.priority ?: 1)
    }
} catch (e: Exception) {
    Log.e("NextClassWidgetProvider", "Failed to load widget data", e)
    emptyList()
}

/**
 * 将部分Int值迁移到Boolean，修正由于数据类型变化导致的解析问题
 */
fun doConfigMigration(context: Context, widgetId: Int) {
    arrayOf("showLastUpdateTime", "showAsSquare").forEach { key ->
        try {
            getInt(context, widgetId, key, -1).let { value ->
                // -1 代表未曾写入
                if (value != -1) {
                    putBoolean(context, widgetId, key, value == 1)
                }
            }
        } catch (_: Exception) {
        }
    }
}

val REQUEST_NEXT_CLASS = 72201
val REQUEST_COURSE_TABLE = 72202
val ACTION_PIN_APP_WIDGET_SUCCESS = "ACTION_PIN_APP_WIDGET_SUCCESS"

fun checkMiShortcutPermission(context: Context): Boolean {
    try {
        val mAppOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager?
        val pkgName = context.applicationContext.packageName
        val uid = context.applicationInfo.uid
        val appOpsClass = Class.forName(AppOpsManager::class.java.getName())
        val checkOpNoThrowMethod = appOpsClass.getDeclaredMethod(
            "checkOpNoThrow",
            Integer.TYPE,
            Integer.TYPE,
            String::class.java
        )
        //INSTALL_SHORTCUT is 10017
        val result = checkOpNoThrowMethod.invoke(mAppOps, 10017, uid, pkgName) as Int
        return result == 0
    } catch (e: Exception) {
        e.printStackTrace()
        return false
    }
}

@RequiresApi(Build.VERSION_CODES.O)
fun addAppWidget(context: Context, requestCode: Int): Boolean {
    val provider = when (requestCode) {
        REQUEST_NEXT_CLASS -> ComponentName(context, NextClassWidgetProvider::class.java)
        else -> ComponentName(context, CourseScheduleWidgetProvider::class.java)
    }
    val successBroadcast = PendingIntent.getBroadcast(
        context,
        0,
        Intent()
            .setAction(ACTION_PIN_APP_WIDGET_SUCCESS),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    val supported = AppWidgetManager.getInstance(context).requestPinAppWidget(
        provider,
        null, successBroadcast
    )
    return supported
}