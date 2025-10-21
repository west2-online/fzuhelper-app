package com.helper.west2ol.fzuhelper

import android.appwidget.AppWidgetManager
import android.app.Activity
import android.content.ComponentName
import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import androidx.work.ListenableWorker.Result


class NextClassUpdateWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        val appWidgetManager = AppWidgetManager.getInstance(applicationContext)
        val ids = appWidgetManager.getAppWidgetIds(
            ComponentName(applicationContext, NextClassWidgetProvider::class.java)
        )
        ids.forEach { id ->
            updateNextClassWidget(applicationContext, appWidgetManager, id)
        }
        return Result.success()
    }
}