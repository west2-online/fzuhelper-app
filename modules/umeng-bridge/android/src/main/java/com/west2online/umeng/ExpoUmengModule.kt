package com.west2online.umeng

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import android.util.Log
import android.widget.Toast
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationManagerCompat
import com.umeng.analytics.MobclickAgent
import com.umeng.commonsdk.UMConfigure
import com.umeng.message.PushAgent
import com.umeng.message.UmengNotificationClickHandler
import com.umeng.message.api.UPushRegisterCallback
import com.umeng.message.entity.UMessage
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class ExpoUmengModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("ExpoUmeng")

        Function("initUmeng") {
            CoroutineScope(Dispatchers.IO).launch {
                val metadata = context.packageManager.getApplicationInfo(
                    context.applicationInfo.packageName,
                    PackageManager.GET_META_DATA
                ).metaData
                UMConfigure.init(
                    context,
                    metadata.getString("UMENG_APPKEY"),
                    metadata.getString("UMENG_CHANNEL"),
                    UMConfigure.DEVICE_TYPE_PHONE,
                    metadata.getString("UMENG_MSGSEC")
                )
                PushAgent.getInstance(context).onAppStart()
                PushAgent.getInstance(context)
                    .register(object : UPushRegisterCallback {
                        override fun onSuccess(deviceToken: String) {
                            Log.d("UMLog", "deviceToken:$deviceToken")
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
                            Log.i("UMLog", "msg:$newMsg")
                        }
                    }
                PushAgent.getInstance(context).notificationClickHandler = notificationClickHandler

                if (BuildConfig.DEBUG) {
                    withContext(Dispatchers.Main) {
                        Toast.makeText(context, "Umeng初始化流程已走完", Toast.LENGTH_SHORT).show()
                    }
                }
            }.start()
            return@Function null
        }

        Function("hasPermission") {
            // 检查通知权限
            return@Function NotificationManagerCompat.from(context).areNotificationsEnabled()
        }

        Function("requirePermission") {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                // 申请通知权限弹窗
                val activity = appContext.currentActivity
                if (activity != null) {
                    ActivityCompat.requestPermissions(
                        activity,
                        arrayOf(android.Manifest.permission.POST_NOTIFICATIONS),
                        1
                    )
                } else {
                    Log.e("UMLog", "Activity is null")
                }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                // 跳转权限设置页面
                val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                    putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
            } else {
                // granted by default
            }
        }

    }

    private val context
        get() = requireNotNull(appContext.reactContext)

}
