package com.helper.west2ol.fzuhelper

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.util.TypedValue.COMPLEX_UNIT_DIP
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import android.util.Log
import com.google.gson.Gson
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import com.helper.west2ol.fzuhelper.CacheCourseData
import com.helper.west2ol.fzuhelper.getWeeks
import com.west2online.nativewidget.R

class CourseScheduleWidgetService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent?): RemoteViewsFactory {
        return CourseScheduleWidgetFactory(applicationContext)
    }

    class CourseScheduleWidgetFactory(val context: Context) : RemoteViewsFactory {
        override fun onCreate() {
        }

        override fun getLoadingView(): RemoteViews? {
            return null
        }

        override fun getItemId(position: Int): Long {
            return position.toLong()
        }

        override fun onDataSetChanged() {
        }

        override fun hasStableIds(): Boolean {
            return true
        }

        override fun getViewAt(position: Int): RemoteViews {
            val itemWeekdays = arrayOf(
                R.id.item_week_day_0,
                R.id.item_week_day_1,
                R.id.item_week_day_2,
                R.id.item_week_day_3,
                R.id.item_week_day_4,
                R.id.item_week_day_5,
                R.id.item_week_day_6,
                R.id.item_week_day_7
            )
            val bgCourses = arrayOf(
                R.drawable.bg_course_1,
                R.drawable.bg_course_2,
                R.drawable.bg_course_3,
                R.drawable.bg_course_4,
                R.drawable.bg_course_5,
                R.drawable.bg_course_6,
                R.drawable.bg_course_7,
                R.drawable.bg_course_8,
                R.drawable.bg_course_9,
                R.drawable.bg_course_10,
                R.drawable.bg_course_11,
                R.drawable.bg_course_12,
                R.drawable.bg_course_13,
                R.drawable.bg_course_14,
                R.drawable.bg_course_15,
                R.drawable.bg_course_16
            )
            val widgetViews = arrayOf(
                R.layout.widget_view_0,
                R.layout.widget_view_1,
                R.layout.widget_view_2,
                R.layout.widget_view_3,
                R.layout.widget_view_4,
                R.layout.widget_view_5,
                R.layout.widget_view_6,
                R.layout.widget_view_7,
                R.layout.widget_view_8,
                R.layout.widget_view_9,
                R.layout.widget_view_10,
                R.layout.widget_view_11
            )
            val remoteViews = RemoteViews(context.packageName, R.layout.item_widget)
            itemWeekdays.forEach {
                remoteViews.removeAllViews(it)
            }

            val cacheCourseData: CacheCourseData
            val jsonData = context
                .getSharedPreferences("${context.packageName}.widgetdata", Context.MODE_PRIVATE)
                .getString("widgetdata", "")
            if (jsonData != "") {
                cacheCourseData = Gson().fromJson(jsonData, CacheCourseData::class.java)
            } else {
                return remoteViews
            }

            val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.PRC)
            val startTime = sdf.parse(cacheCourseData.startDate)?.time ?: 0L
            val week = getWeeks(startTime, System.currentTimeMillis())

            var courseBeans = (cacheCourseData.courseData?.values?.flatten()
                ?: emptyList()) + (cacheCourseData.examData?.values?.flatten()
                ?: emptyList()) + (cacheCourseData.customData?.values?.flatten() ?: emptyList())

            courseBeans = if (cacheCourseData.hiddenCoursesWithoutAttendances?:false ) {
                courseBeans.filter { it.type != 0 || !it.examType.contains("免听") }
            }else {
                courseBeans.sortedBy { !it.examType.contains("免听") }
            }

            //生成左边的序号
            for (i in 1..11) {
                val remoteViews2 = RemoteViews(context.packageName, R.layout.widget_view_0)
                remoteViews2.setTextViewText(R.id.tv_name, i.toString())
                remoteViews2.setTextColor(R.id.tv_name, Color.GRAY)
                remoteViews.addView(R.id.item_week_day_0, remoteViews2)
            }

            // 添加课程信息
            val mark = Array(8) { IntArray(12) { 0 } }
            val mark2 = Array(8) { IntArray(12) { 0 } }
            //先给本周有课的课程需要的位置占坑,防止被本周没课的课程抢占
            for (kc in courseBeans) {
                if (kc.startWeek <= week && kc.endWeek >= week
                    && ((kc.single && week % 2 == 1) || (kc.double && week % 2 == 0))) {
                    for (j in kc.startClass..kc.endClass) {
                        //自定义课程优先于普通课程
                        if (kc.type == 0) {
                            if (mark[kc.weekday][j] == 0)
                                mark[kc.weekday][j] = 1
                        } else
                            mark[kc.weekday][j] = 2
                    }
                }
            }

            for (i in 0 until courseBeans.size) {
                val kc = courseBeans[i]
                if (kc.startWeek <= week && kc.endWeek >= week
                    && ((kc.single && week % 2 == 1) || (kc.double && week % 2 == 0))) {
                    var flag = 0
                    for (j in kc.startClass..kc.endClass) {
                        //如果该坑已被某课程占领就设置标记位以忽略本课程,防止某些极端情况下出现课程冲突
                        //自定义课程优先于普通课程
                        if ((kc.type == 0 && mark[kc.weekday][j] > 1) || mark[kc.weekday][j] > 2) {
                            flag = 1
                            break
                        }
                    }
                    if (flag == 1) continue
                    //标记为已绘制,防止冲突
                    for (j in kc.startClass..kc.endClass) {
                        mark[kc.weekday][j] = 3
                        mark2[kc.weekday][j] = i + 1
                    }
                } else {
                    //忽略仅持续一周的自定义课程
                    if (cacheCourseData.showNonCurrentWeekCourses != true || kc.type > 0) continue
                    var flag = 0
                    for (j in kc.startClass..kc.endClass) {
                        //如果该坑已被某课程占领就设置标记位以忽略本课程,该位置本周没课的课程可能有很多,仅保留第一个
                        if (mark[kc.weekday][j] > 0) {
                            flag = 1
                            break
                        }
                    }
                    if (flag == 1) continue
                    //标记为已绘制,防止冲突
                    for (j in kc.startClass..kc.endClass) {
                        mark[kc.weekday][j] = 3
                        mark2[kc.weekday][j] = -i - 1
                    }
                }
            }

            for (i in 1..7) {
                var preCourseIndex = -1
                var count = 0
                for (j in 1..12) {
                    if (j == 12 || (j != 1 && mark2[i][j] != preCourseIndex)) {
                        val remoteViews2 = RemoteViews(context.packageName, widgetViews[count])
                        if (preCourseIndex != 0) {
                            val kc = courseBeans[if (preCourseIndex > 0) preCourseIndex - 1 else -(preCourseIndex + 1)]
                            var name = kc.name
                            if (name.length >= 13) {
                                name = name.substring(0, 11)
                                name += "..."
                            }
                            remoteViews2.setTextViewText(R.id.tv_name, name + "\n\n" + kc.location)
                            val bg = if (preCourseIndex > 0) {
                                bgCourses[kc.id % bgCourses.size]
                            } else {
                                R.drawable.bg_course_0
                            }
                            remoteViews2.setInt(R.id.tv_name, "setBackgroundResource", bg)
                            val color = if (preCourseIndex > 0) {
                                Color.WHITE
                            } else {
                                Color.GRAY
                            }
                            remoteViews2.setTextColor(R.id.tv_name, color)
                            remoteViews2.setTextViewTextSize(R.id.tv_name, COMPLEX_UNIT_DIP, 10f)
                            //remoteViews2.setFloat(R.id.tv_name, "setAlpha", 0.78f)
                        }
                        remoteViews.addView(itemWeekdays[i], remoteViews2)
                        count = 0
                    }
                    if (j < 12) {
                        preCourseIndex = mark2[i][j]
                        count++
                    }
                }
            }
            val intent = Intent()
            remoteViews.setOnClickFillInIntent(R.id.item_widget, intent)
            return remoteViews
        }

        override fun getCount(): Int {
            return 1
        }

        override fun getViewTypeCount(): Int {
            return 1
        }

        override fun onDestroy() {
        }

    }
}