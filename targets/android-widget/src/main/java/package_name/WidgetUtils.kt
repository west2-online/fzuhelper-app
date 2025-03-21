package com.helper.west2ol.fzuhelper

import androidx.annotation.Keep
import android.content.Context
import android.content.SharedPreferences

/**
 * 课程扩展类，包含课程基本信息和额外属性
 */
@Keep
data class ExtendCourse(
    val id: Int,                 // 课程唯一ID
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
    val examType: String,        // 考试类型
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
    val hiddenCoursesWithoutAttendances: Boolean?,            // 是否显示免听课程
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

fun saveWidgetConfig(context: Context, appWidgetId: Int,key: String,value: Boolean) {
    getSharedPreference(context).edit().putBoolean("$appWidgetId$key", value).commit()
}

fun loadWidgetConfig(context: Context, appWidgetId: Int, key: String): Boolean {
    return getSharedPreference(context).getBoolean("$appWidgetId$key", false)
}

fun deleteWidgetConfig(context: Context, appWidgetId: Int , key: String) {
    getSharedPreference(context).edit().remove("$appWidgetId$key").commit()
}
