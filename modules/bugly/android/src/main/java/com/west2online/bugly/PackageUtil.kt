@file:Suppress("DEPRECATION")

package com.west2online.bugly

import android.content.Context
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.os.Build

class PackageUtil {
    private lateinit var context: Context

    constructor(context: Context) {
        this.context = context
    }

    fun PackageManager.getPackageInfoCompat(packageName: String, flags: Int = 0): PackageInfo =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getPackageInfo(packageName, PackageManager.PackageInfoFlags.of(flags.toLong()))
        } else {
            getPackageInfo(packageName, flags)
        }


    private val packageInfo by lazy {
        context.packageManager.getPackageInfoCompat(
            context.packageName,
            0
        )
    }

    fun getVersionCode(): Long {
        return if (Build.VERSION.SDK_INT > Build.VERSION_CODES.P) {
            packageInfo.longVersionCode
        } else {
            packageInfo.versionCode.toLong()
        }
    }

    fun getVersionName(): String {
        return packageInfo.versionName ?: ""
    }
}