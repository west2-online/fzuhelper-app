package com.helper.west2ol.fzuhelper.dev

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

    val nextClass = getNextClass(context)
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
                "周${getWeekChinese(nextClass.courseBean.kcWeekend)}"
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

internal fun getNextClass(context: Context): ClassInfo? {
    val sharedPreferences = context.getSharedPreferences("${context.packageName}.widgetdata", Context.MODE_PRIVATE)
    var selectedSemester = JSONObject(sharedPreferences.getString("CourseSetting", "{}")!!).optString("selectedSemester")
    val courseTermsList = JSONObject(sharedPreferences.getString("course_terms_list", "{}")!!)
        .optJSONObject("data")?.optJSONObject("data")
    val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
    val allEntries: Map<String, *> = sharedPreferences.all
    for ((key, value) in allEntries) {
        Log.e("widget","Key: $key, Value: $value")
    }

    if (courseTermsList == null) return null
    if (selectedSemester == null || selectedSemester.isEmpty()) {
        selectedSemester = courseTermsList.getString("current_term")
    }
    val courseData = JSONObject(sharedPreferences.getString("course_data__"+selectedSemester, "{}")!!)
        .optJSONObject("data")?.optJSONArray("data")
    if (courseData == null) return null

    val jsonArray = courseTermsList.getJSONArray("terms")
    var startDate: Long = 0
    var endDate: Long = 0
    var endWeek: Int = 0

    for (i in 0 until jsonArray.length()) {
        val item = jsonArray.getJSONObject(i)
        if (item.getString("term")==selectedSemester){
            startDate = LocalDate.parse(item.getString("start_date"), formatter)
                .atStartOfDay().toEpochSecond(ZoneOffset.UTC)
            endDate = LocalDate.parse(item.getString("end_date"), formatter)
               .atStartOfDay().toEpochSecond(ZoneOffset.UTC)
            endWeek = getWeeks(startDate, endDate)
            break
        }
    }

    val week = getWeeks(startDate, System.currentTimeMillis()/1000)
    val classTime = getNextClassTime(startDate)

    return searchNextClassIterative(week, classTime, courseData, endWeek)
}

fun getWeeks(startTime: Long, endTime: Long): Int {
    if (endTime < startTime) {
        return 1
    }
    val res = ((endTime - startTime) / (7 * 24 * 60 * 60L) + 1).toInt()
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

//判断当前时间是一周的第几节课,返回下一节课的时间
fun getNextClassTime(startTime: Long): ClassTime {

    //当还未开学时，设置当前为周一第1节
    if (startTime > System.currentTimeMillis()/1000) {
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

fun searchNextClassIterative(week:Int, classTime: ClassTime,couresData: JSONArray, endWeek: Int): ClassInfo? {
    var currentWeek = week
    var currentWeekday = classTime.weekday
    var currentSection = classTime.section

    while (currentWeek <= endWeek) {
        var foundExam: CourseBean? = null
        var foundCustom: CourseBean? = null
        var foundOrdinary: CourseBean? = null

        for (i in 0 until couresData.length()) {
            val rawCourse = couresData.getJSONObject(i)
            val courseDetailList = rawCourse.getJSONArray("scheduleRules")
            for (j in 0 until courseDetailList.length()) {
                val courseDetail = courseDetailList.getJSONObject(j)
                if (currentWeek in courseDetail.getInt("startWeek")..courseDetail.getInt("endWeek")
                    && ((courseDetail.getBoolean("single") && currentWeek % 2 == 1)
                            || (courseDetail.getBoolean("double") && currentWeek % 2 == 0))
                    && currentWeekday == courseDetail.getInt("weekday")
                    && currentSection == courseDetail.getInt("startClass")
                ) {
                    val course = CourseBean(
                        kcName = rawCourse.getString("name"),
                        kcLocation = courseDetail.getString("location"),
                        kcStartTime = courseDetail.getInt("startClass"),
                        kcEndTime = courseDetail.getInt("endClass"),
                        kcWeekend = courseDetail.getInt("weekday"),
                        kcNote = rawCourse.getString("remark")
                    )
                    when (course.type) {
                        1 -> foundExam = course
                        0 -> foundCustom = course
                        else -> foundOrdinary = course
                    }
                }
            }
        }

        // 优先级：考试>自定义课程>教务处导入课程
        if (foundExam != null) {
            return ClassInfo(currentWeek, foundExam)
        } else if (foundCustom != null) {
            return ClassInfo(currentWeek, foundCustom)
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
