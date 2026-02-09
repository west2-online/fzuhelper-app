package com.west2online.nativewidget

import android.appwidget.AppWidgetManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AlertDialog
import androidx.core.content.ContextCompat
import com.helper.west2ol.fzuhelper.ACTION_PIN_APP_WIDGET_SUCCESS
import com.helper.west2ol.fzuhelper.MiPermissionFragment
import com.helper.west2ol.fzuhelper.addAppWidget
import com.helper.west2ol.fzuhelper.checkMiShortcutPermission
import com.hjq.device.compat.DeviceOs
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch


class NativeWidgetModule : Module() {

    private var widgetPromise: Promise? = null
    private var widgetReceiver: BroadcastReceiver? = null
    private val handler = Handler(Looper.getMainLooper())
    private var timeoutRunnable: Runnable? = null

    companion object {
        var failureCallback: (() -> Unit)? = null
        var startTimeoutCallback: (() -> Unit)? = null
    }

    private fun cleanupAndResolve(success: Boolean) {
        timeoutRunnable?.let { handler.removeCallbacks(it) }
        timeoutRunnable = null

        widgetReceiver?.let {
            try {
                context.unregisterReceiver(it)
            } catch (_: Exception) {
            }
        }

        widgetPromise?.resolve(success)

        widgetReceiver = null
        widgetPromise = null
        failureCallback = null
        startTimeoutCallback = null
    }

    private fun startWidgetPinTimeout() {
        timeoutRunnable = Runnable {
            // Toast.makeText(context, "添加小部件超时", Toast.LENGTH_SHORT).show()
            cleanupAndResolve(false)
        }
        handler.postDelayed(timeoutRunnable!!, 3000)
    }

    override fun definition() = ModuleDefinition {
        Name("NativeWidget")

        OnDestroy {
            cleanupAndResolve(false)
        }

        Function("setWidgetData") { json: String, packageName: String ->
            getPreferences(packageName).edit().putString("widgetdata", json).commit()

            val intent = Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE)
            val widgetManager = AppWidgetManager.getInstance(context)
            val widgetProviders = context.packageManager.queryBroadcastReceivers(
                Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE),
                PackageManager.GET_META_DATA
            )

            for (provider in widgetProviders) {
                if (provider.activityInfo.packageName == packageName) {
                    val providerComponent = ComponentName(
                        provider.activityInfo.packageName,
                        provider.activityInfo.name
                    )
                    val widgetIds = widgetManager.getAppWidgetIds(providerComponent)
                    intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, widgetIds)
                    context.sendBroadcast(intent)
                }
            }
        }

        AsyncFunction("requestPinAppWidget") { requestCode: Int, promise: Promise ->
            cleanupAndResolve(false) // 清理残留

            widgetPromise = promise

            failureCallback = { cleanupAndResolve(false) }
            startTimeoutCallback = { startWidgetPinTimeout() }

            widgetReceiver = object : BroadcastReceiver() {
                override fun onReceive(context: Context, intent: Intent) {
                    // Toast.makeText(context, "添加小部件成功", Toast.LENGTH_SHORT).show()
                    cleanupAndResolve(true)
                }
            }

            val intentFilter = IntentFilter(ACTION_PIN_APP_WIDGET_SUCCESS)
            ContextCompat.registerReceiver(
                context,
                widgetReceiver!!,
                intentFilter,
                ContextCompat.RECEIVER_EXPORTED
            )

            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
                cleanupAndResolve(false)
                return@AsyncFunction
            }

            if ((DeviceOs.isHyperOs() || DeviceOs.isMiui()) && !checkMiShortcutPermission(context)) {
                // 小米设备专属权限
                CoroutineScope(Dispatchers.Main).launch {
                    AlertDialog.Builder(context)
                        .setTitle("授权提醒")
                        .setMessage("创建桌面小部件需要您授予\"桌面快捷方式\"权限。\n\n请您在接下来的应用详情界面进入\"权限管理\"，找到该权限并修改为允许。")
                        .setPositiveButton("继续") { _, _ ->
                            (context as androidx.appcompat.app.AppCompatActivity).supportFragmentManager.beginTransaction()
                                .add(
                                    MiPermissionFragment.newInstance(requestCode),
                                    "permission_fragment"
                                )
                                .commit()
                        }
                        .setNegativeButton("取消") { _, _ -> cleanupAndResolve(false) }
                        .setOnCancelListener { cleanupAndResolve(false) }
                        .show()
                }
            } else if (DeviceOs.isOriginOs()) {
                // vivo设备请求加桌能力需原子组件适配 https://dev.vivo.com.cn/documentCenter/doc/845#s-p6v4qah3
                cleanupAndResolve(false)
            } else {
                if (addAppWidget(context, requestCode)) {
                    startWidgetPinTimeout()
                } else {
                    cleanupAndResolve(false)
                }
            }
        }
    }

    private val context
        get() = requireNotNull(appContext.currentActivity)

    private fun getPreferences(packageName: String): SharedPreferences {
        return context.getSharedPreferences(packageName + ".widgetdata", Context.MODE_PRIVATE)
    }
}