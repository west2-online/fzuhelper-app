package com.helper.west2ol.fzuhelper

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.graphics.Rect
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.SizeF
import android.view.View
import android.widget.FrameLayout
import android.widget.RemoteViews
import android.widget.TextView
import com.west2online.nativewidget.R
import kotlin.math.roundToInt

internal class CourseWidgetRenderer(
    private val context: Context,
    private val snapshot: CourseWidgetSnapshot?,
    private val message: String,
    private val widgetId: Int,
    private val defaultMedium: Boolean,
) {
    private val now = System.currentTimeMillis()
    private val showRemarks = getBoolean(context, widgetId, "showRemarks", true)
    private val previewTomorrow = getBoolean(context, widgetId, "previewTomorrow", false)

    @Suppress("DEPRECATION")
    fun render(options: Bundle): RemoteViews {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val sizes = options.getParcelableArrayList<SizeF>(AppWidgetManager.OPTION_APPWIDGET_SIZES)
            if (!sizes.isNullOrEmpty()) {
                return RemoteViews(sizes.associateWith { renderSize(it.width, it.height) })
            }
        }
        val width = if (defaultMedium) 338 else 158
        val minWidth = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, width).toFloat()
        val maxWidth = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH, width).toFloat()
        val minHeight = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 158).toFloat()
        val maxHeight = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 158).toFloat()
        return RemoteViews(renderSize(maxWidth, minHeight), renderSize(minWidth, maxHeight))
    }

    private fun renderSize(width: Float, height: Float): RemoteViews {
        val medium = defaultMedium || width >= 270
        val inset = if (!medium && getBoolean(context, widgetId, "showAsSquare", false)) {
            ((height - width) / 2).coerceAtLeast(0f)
        } else 0f
        val views = RemoteViews(context.packageName, R.layout.next_class_widget_provider)
        views.setViewPadding(R.id.next_class_widget_root, 0, dp(inset), 0, dp(inset))
        views.removeAllViews(R.id.widget_days)
        val openApp = PendingIntent.getActivity(
            context, widgetId,
            Intent(Intent.ACTION_VIEW, Uri.parse("fzuhelper://")).setPackage(context.packageName),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.container, openApp)

        if (snapshot == null) {
            views.addView(R.id.widget_days, emptyView(message))
            return views
        }

        val availableHeight = dp(height - inset * 2 - 36)
        val columnWidth = dp(if (medium) (width - 46) / 2 else width - 36).coerceAtLeast(1)
        val today = if (medium) snapshot.day(now) else snapshot.smallDay(now, previewTomorrow)
        views.addView(R.id.widget_days, dayView(today, columnWidth, availableHeight, true))
        if (medium) {
            views.addView(R.id.widget_days, RemoteViews(context.packageName, R.layout.course_widget_column_gap))
            views.addView(R.id.widget_days, dayView(snapshot.day(now, tomorrow = true), columnWidth, availableHeight, false))
        }
        return views
    }

    private fun dayView(day: CourseWidgetDay, width: Int, height: Int, showWeekday: Boolean): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.course_widget_day)
        views.setTextViewText(R.id.widget_date, if (day.isTomorrow) "明日课程" else snapshot!!.formatted(day.date, "MM月dd日"))
        views.setTextColor(R.id.widget_date, context.getColor(if (day.isTomorrow) R.color.widget_secondary else R.color.widget_heading))
        views.setTextViewText(R.id.widget_weekday, snapshot!!.formatted(day.date, "EEE"))
        views.setViewVisibility(R.id.widget_weekday, if (showWeekday) View.VISIBLE else View.GONE)
        trimText(views, R.id.widget_date, R.id.widget_weekday)
        views.removeAllViews(R.id.widget_events)
        if (day.events.isEmpty()) {
            views.addView(R.id.widget_events, emptyView(day.emptyText))
            return views
        }

        val header = views.apply(context, FrameLayout(context)).findViewById<View>(R.id.widget_header)
        header.measure(View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY), View.MeasureSpec.UNSPECIFIED)
        val available = height - header.measuredHeight - dp(8)
        val rows = day.events.mapIndexed { index, course -> eventView(course, day.isTomorrow || index > 0) }.toMutableList()
        val remaining = remainingView(day.events.size - 1)
        val heights = rows.map { measuredHeight(it, width) }
        val layout = selectLayout(
            heights, measuredHeight(remaining, width), available, dp(4), day.isTomorrow
        )
        // 日期、课名、教室和时间优先保留，当前课程的备注优先于后续课程。
        // 依次隐藏剩余提示、后续课程，再将备注从 3 行减至 2、1、0 行。
        // 仍放不下才把课名从 2 行减为 1 行；使用省略号，保留系统字号。
        if (layout == null && !day.isTomorrow) {
            val course = day.events.first()
            val variants = buildList {
                if (showRemarks && course.remark.isNotEmpty()) {
                    for (lines in 2 downTo 0) add(eventView(course, false, remarkLines = lines))
                }
                add(eventView(course, false, remarkLines = 0, nameLines = 1))
            }
            rows[0] = variants.firstOrNull { measuredHeight(it, width) <= available } ?: variants.last()
        }
        rows.take(layout?.count ?: 1).forEachIndexed { index, row ->
            if (index > 0) views.addView(R.id.widget_events, RemoteViews(context.packageName, R.layout.course_widget_gap))
            views.addView(R.id.widget_events, row)
        }
        if (layout?.showRemaining == true) {
            views.addView(R.id.widget_events, RemoteViews(context.packageName, R.layout.course_widget_gap))
            views.addView(R.id.widget_events, remainingView(day.events.size - layout.count))
        }
        return views
    }

    private data class Layout(val count: Int, val showRemaining: Boolean)

    private fun selectLayout(
        heights: List<Int>, remainingHeight: Int, availableHeight: Int, gap: Int, tomorrow: Boolean,
    ): Layout? {
        val candidates = if (tomorrow) {
            (heights.size downTo 1).map { Layout(it, false) }
        } else buildList {
            if (heights.size > 2) add(Layout(2, true))
            if (heights.size > 1) add(Layout(2, false))
            add(Layout(1, false))
        }
        return candidates.firstOrNull { candidate ->
            val height = heights.take(candidate.count).sum() + gap * (candidate.count - 1) +
                if (candidate.showRemaining) gap + remainingHeight else 0
            height <= availableHeight
        }
    }

    private fun eventView(course: WidgetCourseEvent, compact: Boolean, remarkLines: Int = 3, nameLines: Int = 2): RemoteViews {
        val views = RemoteViews(context.packageName, if (compact) R.layout.course_widget_compact else R.layout.course_widget_event)
        views.setTextViewText(R.id.course_name, course.name)
        views.setTextViewText(R.id.course_room, course.location)
        views.setTextViewText(R.id.course_time, course.timeText)
        if (!compact) {
            views.setInt(R.id.course_name, "setMaxLines", nameLines)
            views.setTextViewText(R.id.course_remark, course.remark)
            views.setInt(R.id.course_remark, "setMaxLines", remarkLines)
            views.setViewVisibility(R.id.course_remark, if (showRemarks && remarkLines > 0 && course.remark.isNotEmpty()) View.VISIBLE else View.GONE)
            trimText(views, R.id.course_remark)
        }
        trimText(views, R.id.course_name, R.id.course_room, R.id.course_time)
        return views
    }

    private fun remainingView(count: Int): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.course_widget_remaining)
        views.setTextViewText(R.id.remaining_text, "其他 $count 节课")
        views.setViewVisibility(R.id.remaining_second, if (count >= 2) View.VISIBLE else View.GONE)
        views.setViewVisibility(R.id.remaining_third, if (count >= 3) View.VISIBLE else View.GONE)
        trimText(views, R.id.remaining_text)
        return views
    }

    private fun emptyView(text: String) = RemoteViews(context.packageName, R.layout.course_widget_empty).apply {
        setTextViewText(R.id.widget_empty, text)
        trimText(this, R.id.widget_empty)
    }

    // 按字体度量去掉行首尾留白，保留实际字形和系统字号缩放。
    private fun trimText(views: RemoteViews, vararg ids: Int) {
        val layout = views.apply(context, FrameLayout(context))
        for (id in ids) {
            val text = layout.findViewById<TextView>(id)
            val metrics = text.paint.fontMetrics
            val bounds = Rect()
            text.paint.getTextBounds(text.text.toString(), 0, text.length(), bounds)
            views.setViewPadding(id, 0, (metrics.ascent - bounds.top).roundToInt(), 0,
                (bounds.bottom - metrics.descent).roundToInt())
        }
    }

    private fun measuredHeight(views: RemoteViews, width: Int): Int {
        val view = views.apply(context, FrameLayout(context))
        view.measure(View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY), View.MeasureSpec.UNSPECIFIED)
        return view.measuredHeight
    }

    private fun dp(value: Number) = (value.toFloat() * context.resources.displayMetrics.density).roundToInt()
}
