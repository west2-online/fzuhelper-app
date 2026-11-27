package com.helper.west2ol.fzuhelper

import androidx.annotation.Keep
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone

// 与 lib/course-widget.ts 中的小组件快照保持一致。
@Keep
data class WidgetCourseEvent(
    val date: String,
    val name: String,
    val location: String,
    val remark: String,
    val startMinute: Int,
    val endMinute: Int,
) {
    val timeText: String
        get() = String.format(Locale.ROOT, "%02d:%02d-%02d:%02d", startMinute / 60, startMinute % 60, endMinute / 60, endMinute % 60)
}

data class CourseWidgetDay(
    val date: Long,
    val isTomorrow: Boolean,
    val events: List<WidgetCourseEvent>,
    val emptyText: String,
)

@Keep
data class CourseWidgetSnapshot(
    val version: Int,
    val timeZone: String,
    val startDate: String,
    val endDate: String,
    val events: List<WidgetCourseEvent>,
) {
    private fun calendar(now: Long) = Calendar.getInstance(TimeZone.getTimeZone(timeZone)).apply {
        timeInMillis = now
    }

    fun formatted(date: Long, pattern: String): String = SimpleDateFormat(pattern, Locale.CHINA).apply {
        timeZone = TimeZone.getTimeZone(this@CourseWidgetSnapshot.timeZone)
    }.format(Date(date))

    fun day(now: Long, tomorrow: Boolean = false): CourseWidgetDay {
        val calendar = calendar(now)
        val minute = calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE)
        if (tomorrow) calendar.add(Calendar.DAY_OF_YEAR, 1)
        val key = formatted(calendar.timeInMillis, "yyyy-MM-dd")
        val courses = events.filter { it.date == key }
        val remaining = courses.filter { tomorrow || it.endMinute > minute }
        val emptyText = when {
            key < startDate -> "尚未开学"
            key > endDate -> "本学期已结束"
            tomorrow -> "明日没有课程"
            courses.isEmpty() -> "今日没有课程"
            else -> "今日课程已结束"
        }
        return CourseWidgetDay(calendar.timeInMillis, tomorrow, remaining, emptyText)
    }

    fun smallDay(now: Long, previewTomorrow: Boolean): CourseWidgetDay {
        val today = day(now)
        val calendar = calendar(now)
        val minute = calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE)
        // 今日仍有未结束的课程或考试时，优先保留今日。
        return if (today.events.isEmpty() && (previewTomorrow || minute >= 21 * 60 + 35)) {
            day(now, tomorrow = true)
        } else today
    }

    fun nextChange(now: Long): Long {
        val start = calendar(now).apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis
        val nextDay = calendar(start).apply { add(Calendar.DAY_OF_YEAR, 1) }.timeInMillis
        val key = formatted(now, "yyyy-MM-dd")
        val minutes = events.filter { it.date == key }.map { it.endMinute } + (21 * 60 + 35)
        return (minutes.map { start + it * 60_000L } + nextDay).filter { it > now }.min()
    }
}

@Keep
data class CourseWidgetCache(val widgetSnapshot: CourseWidgetSnapshot?)
