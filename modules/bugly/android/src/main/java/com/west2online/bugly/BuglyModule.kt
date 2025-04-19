package com.west2online.bugly

import com.tencent.bugly.crashreport.CrashReport
import expo.modules.BuildConfig
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.URL

class BuglyModule : Module() {
    private val BUGLY_APP_ID = "27422503a8"

    override fun definition() = ModuleDefinition {
        Name("Bugly")

        AsyncFunction("initBugly") {
            val packageUtil = PackageUtil(context)
            val versionCode = packageUtil.getVersionCode()
            val versionName = packageUtil.getVersionName()
            val strategy = CrashReport.UserStrategy(context)
            strategy.appVersion = "$versionName ($versionCode)"
            strategy.isUploadProcess = true
            CrashReport.setIsDevelopmentDevice(context, BuildConfig.DEBUG)
            CrashReport.initCrashReport(context, BUGLY_APP_ID, BuildConfig.DEBUG, strategy)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("setUserId") { userId: String ->
            CrashReport.setUserId(userId)
        }.runOnQueue(Queues.MAIN)

    }

    private val context
        get() = requireNotNull(appContext.reactContext)

}
