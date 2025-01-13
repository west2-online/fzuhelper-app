package com.west2online.umeng

import android.app.Activity
import android.content.Context
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import com.umeng.analytics.MobclickAgent
import com.umeng.commonsdk.UMConfigure
import com.umeng.message.PushAgent
import com.umeng.message.UmengNotificationClickHandler
import com.umeng.message.api.UPushRegisterCallback
import com.umeng.message.entity.UMessage
import expo.modules.core.interfaces.ReactActivityLifecycleListener


class ExpoUmengModuleReactActivityLifecycleListener : ReactActivityLifecycleListener {

  private var info: ApplicationInfo? = null;

  override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
    try {
      info = activity.packageManager.getApplicationInfo(
        activity.applicationInfo.packageName,
        PackageManager.GET_META_DATA
      )
    } catch (e: PackageManager.NameNotFoundException) {
      throw RuntimeException(e)
    }
    UMConfigure.init(
      activity.applicationContext,
      null,
      null,
      UMConfigure.DEVICE_TYPE_PHONE,
      info!!.metaData.getString("UMENG_MSGSEC")
    )
    PushAgent.getInstance(activity.applicationContext).onAppStart();
    PushAgent.getInstance(activity.applicationContext).register(object : UPushRegisterCallback {
      override fun onSuccess(deviceToken: String) {
        Log.d("UMLog", "deviceToken:$deviceToken")
        activity.applicationContext.getSharedPreferences(
          "MyAppPreferences", Context.MODE_PRIVATE
        ).edit().putString("deviceToken", deviceToken).apply()
      }
      override fun onFailure(errCode: String, errDesc: String) {
        Log.e("UMLog", "注册失败 code:$errCode, desc:$errDesc")
      }
    })

    MobclickAgent.setPageCollectionMode(MobclickAgent.PageMode.AUTO)
    val notificationClickHandler: UmengNotificationClickHandler =
      object : UmengNotificationClickHandler() {
        override fun launchApp(context: Context, msg: UMessage) {
          val newMsg = msg.extra;
          newMsg["time"] = System.currentTimeMillis().toString()
          Log.i("UMLog", "msg:$newMsg")
          activity.applicationContext.getSharedPreferences(
            "MyAppPreferences", Context.MODE_PRIVATE
          ).edit().putString("msg", newMsg.toString()).apply()
        }
      }
    PushAgent.getInstance(activity.applicationContext).notificationClickHandler =
      notificationClickHandler
  }


}
