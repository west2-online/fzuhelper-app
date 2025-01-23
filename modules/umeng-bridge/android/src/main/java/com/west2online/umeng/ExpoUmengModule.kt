package com.west2online.umeng

import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import android.util.Log
import android.widget.Toast
import androidx.annotation.RequiresApi
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
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext

class ExpoUmengModule : Module() {
    private var upushRegistered = false
    private var error = ""

    class ResponseMapper : Record {
        // tag 集合 是一个字符串数组，默认为空
        @Field
        var data: List<String> = emptyList()

        // 剩余可用的 tag 数
        @Field
        var remain: Int = 0

        // 错误信息
        @Field
        var error: String = ""
    }

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
                            upushRegistered = true
                        }

                        override fun onFailure(errCode: String, errDesc: String) {
                            Log.e("UMLog", "注册失败 code:$errCode, desc:$errDesc")
                            upushRegistered = false
                            appendError("PushAgent.getInstance(context).register 注册失败 code:$errCode, desc:$errDesc")
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
            }
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
                    CoroutineScope(Dispatchers.Main).launch {
                        // 300ms内弹窗未弹出（App仍在前台），且已拒绝，说明是永久拒绝
                        delay(300)
                        if (isForegroundActivityFromMyApp(activity) &&
                            !NotificationManagerCompat.from(context).areNotificationsEnabled()
                        ) {
                            gotoPermissionPage()
                        }
                    }
                } else {
                    Log.e("UMLog", "Activity is null")
                    gotoPermissionPage()
                }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                gotoPermissionPage()
            } else {
                // granted by default
            }
        }

        Function("getDeviceToken") {
            return@Function PushAgent.getInstance(context).registrationId
        }

        Function("isRegisteredForRemoteNotifications") {
            return@Function upushRegistered
        }

        Function("getError") {
            return@Function error
        }

        Function("getAppKeyAndChannel") {
            val metadata = context.packageManager.getApplicationInfo(
                context.applicationInfo.packageName,
                PackageManager.GET_META_DATA
            ).metaData
            return@Function metadata.getString("UMENG_APPKEY") + ", " +
                    metadata.getString("UMENG_CHANNEL")
        }

        Function("getAllTags") {
            return@Function runBlocking(Dispatchers.IO) {
                val response = ResponseMapper()
                val deferred = CompletableDeferred<ResponseMapper>()
                PushAgent.getInstance(context).tagManager.getTags { isSuccess, data ->
                    if (isSuccess) {
                        response.data = data
                        // 目前每个用户tag限制在1024个
                        // https://developer.umeng.com/docs/67966/detail/98583#h1--tag-alias-4
                        response.remain = 1024 - data.size
                    } else {
                        response.error = "ExpoUmengModule: Failed to get tags"
                    }
                    deferred.complete(response)
                }
                deferred.await()
            }
        }

        Function("addTags") { tags: List<String> ->
            return@Function runBlocking(Dispatchers.IO) {
                val response = ResponseMapper()
                val deferred = CompletableDeferred<ResponseMapper>()
                PushAgent.getInstance(context).tagManager.addTags({ isSuccess, result ->
                    if (isSuccess) {
                        response.data = listOf("ExpoUmengModule: 友盟安卓SDK添加接口不返回tag列表")
                        response.remain = result.remain
                    } else {
                        response.error = "ExpoUmengModule: Failed to add tags"
                    }
                    deferred.complete(response)
                }, *tags.toTypedArray())
                deferred.await()
            }
        }

        Function("deleteTags") { tags: List<String> ->
            return@Function runBlocking(Dispatchers.IO) {
                val response = ResponseMapper()
                val deferred = CompletableDeferred<ResponseMapper>()
                PushAgent.getInstance(context).tagManager.deleteTags({ isSuccess, result ->
                    if (isSuccess) {
                        response.data = listOf("ExpoUmengModule: 友盟安卓SDK删除接口不返回tag列表")
                        response.remain = result.remain
                    } else {
                        response.error = "ExpoUmengModule: Failed to delete tags"
                    }
                    deferred.complete(response)
                }, *tags.toTypedArray())
                deferred.await()
            }
        }
    }

    private val context
        get() = requireNotNull(appContext.reactContext)

    // 跳转权限设置页面
    @RequiresApi(Build.VERSION_CODES.O)
    private fun gotoPermissionPage() {
        val activity = appContext.currentActivity
        val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
            putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
        }
        if (activity != null) {
            activity.startActivity(intent)
        } else {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
        }
    }

    private fun isForegroundActivityFromMyApp(context: Context): Boolean {
        try {
            // 获取 ActivityManager 实例
            val activityManager =
                context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager

            @Suppress("DEPRECATION") val tasks = activityManager.getRunningTasks(1)

            if (tasks.isNotEmpty()) {
                // 获取前台 Activity 的信息
                val topActivity = tasks[0].topActivity

                // 检查前台 Activity 是否属于本应用
                if (topActivity != null && topActivity.packageName == context.packageName) {
                    return true
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return false
    }

    private fun appendError(err: String) {
        error += err + "\n\n"
    }
}
