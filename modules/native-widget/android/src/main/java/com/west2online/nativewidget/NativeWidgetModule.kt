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

    val cleanupAndResolveFalse = {
        if (widgetReceiver != null) {
            try {
                context.unregisterReceiver(widgetReceiver)
            } catch (e: Exception) { /* Ignore */ }
        }
        widgetPromise?.resolve(false)
        widgetReceiver = null
        widgetPromise = null
    }

    override fun definition() = ModuleDefinition {
        Name("NativeWidget")

        OnDestroy {
            cleanupAndResolveFalse()
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

        // Returns a promise that resolves to true if the widget is successfully added, false otherwise.
        AsyncFunction("requestPinAppWidget") { requestCode: Int, promise: Promise ->
            // Cancel any pending request to avoid multiple receivers and dangling promises.
            widgetPromise?.resolve(false)
            if (widgetReceiver != null) {
                try {
                    context.unregisterReceiver(widgetReceiver)
                } catch (e: Exception) { /* Ignore if already unregistered */ }
            }

            widgetPromise = promise
            widgetReceiver = object : BroadcastReceiver() {
                override fun onReceive(context: Context, intent: Intent) {
                    widgetPromise?.resolve(true)
                    // Clean up after success
                    try {
                        context.unregisterReceiver(this)
                    } catch (e: Exception) { /* Ignore */ }
                    widgetReceiver = null
                    widgetPromise = null
                }
            }

            val intentFilter = IntentFilter(ACTION_PIN_APP_WIDGET_SUCCESS)
            ContextCompat.registerReceiver(
                context,
                widgetReceiver,
                intentFilter,
                ContextCompat.RECEIVER_EXPORTED
            )

            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
                cleanupAndResolveFalse()
                return@AsyncFunction
            }

            if ((DeviceOs.isHyperOs() || DeviceOs.isMiui()) && !checkMiShortcutPermission(context)) {
                CoroutineScope(Dispatchers.Main).launch {
                    AlertDialog.Builder(context)
                        .setTitle("授权提醒")
                        .setMessage("创建桌面小部件需要您授予\"桌面快捷方式\"权限。\n\n请您在接下来的应用详情界面进入\"权限管理\"，找到该权限并修改为允许。")
                        .setPositiveButton("继续") { _, _ ->
                            (context as? androidx.appcompat.app.AppCompatActivity)?.supportFragmentManager?.beginTransaction()
                                ?.add(MiPermissionFragment.newInstance(requestCode), "permission_fragment")
                                ?.commit()
                        }
                        .setNegativeButton("取消") { _, _ ->
                            cleanupAndResolveFalse()
                        }
                        .setOnCancelListener {
                            cleanupAndResolveFalse()
                        }
                        .show()
                }
            } else if (DeviceOs.isOriginOs()) {
                cleanupAndResolveFalse()
            } else {
                if (!addAppWidget(context, requestCode)) {
                    cleanupAndResolveFalse()
                }
                // if addAppWidget returns true, we wait for the broadcast to resolve the promise.
            }
        }
    }

    private val context
        get() = requireNotNull(appContext.currentActivity)

    private fun getPreferences(packageName: String): SharedPreferences {
        return context.getSharedPreferences(packageName + ".widgetdata", Context.MODE_PRIVATE)
    }

}