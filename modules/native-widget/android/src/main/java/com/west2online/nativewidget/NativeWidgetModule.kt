package com.west2online.nativewidget

import android.util.Log
import android.content.Context
import android.content.SharedPreferences
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.content.Intent
import android.content.ComponentName
import android.appwidget.AppWidgetManager
import android.content.pm.PackageManager

class NativeWidgetModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("NativeWidget")
    }
}