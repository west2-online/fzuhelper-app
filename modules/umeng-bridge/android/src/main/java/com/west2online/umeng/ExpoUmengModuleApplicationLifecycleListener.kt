package com.west2online.umeng

import android.app.Application
import android.content.pm.PackageManager
import com.umeng.commonsdk.UMConfigure
import expo.modules.core.interfaces.ApplicationLifecycleListener


class ExpoUmengModuleApplicationLifecycleListener : ApplicationLifecycleListener {
    override fun onCreate(application: Application) {
        UMConfigure.setLogEnabled(BuildConfig.DEBUG)

        val metadata = application.packageManager.getApplicationInfo(
            application.applicationInfo.packageName,
            PackageManager.GET_META_DATA
        ).metaData
        UMConfigure.preInit(
            application.applicationContext,
            metadata.getString("UMENG_APPKEY"),
            metadata.getString("UMENG_CHANNEL")
        )
    }
}
