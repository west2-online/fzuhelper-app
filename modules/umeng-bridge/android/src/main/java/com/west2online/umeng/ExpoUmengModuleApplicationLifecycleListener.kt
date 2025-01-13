package com.west2online.umeng

import android.app.Application
import com.umeng.commonsdk.UMConfigure
import expo.modules.core.interfaces.ApplicationLifecycleListener


class ExpoUmengModuleApplicationLifecycleListener : ApplicationLifecycleListener {
  override fun onCreate(application: Application) {
    UMConfigure.preInit(application.applicationContext, null, null)
  }
}
