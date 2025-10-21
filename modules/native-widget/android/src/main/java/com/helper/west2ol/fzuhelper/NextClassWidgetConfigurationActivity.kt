package com.helper.west2ol.fzuhelper

import android.appwidget.AppWidgetManager
import android.content.Intent
import android.content.Context
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.workDataOf
import java.util.concurrent.TimeUnit
import com.west2online.nativewidget.R
import com.west2online.nativewidget.databinding.NextClassWidgetConfigurationBinding


class NextClassWidgetConfigurationActivity : AppCompatActivity() {
    private var appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID
    private lateinit var binding: NextClassWidgetConfigurationBinding

    public override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = NextClassWidgetConfigurationBinding.inflate(layoutInflater)
        setContentView(binding.root)

        appWidgetId = intent?.extras?.getInt(
            AppWidgetManager.EXTRA_APPWIDGET_ID,
            AppWidgetManager.INVALID_APPWIDGET_ID
        ) ?: AppWidgetManager.INVALID_APPWIDGET_ID

        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            setResult(RESULT_CANCELED)
            finish()
            return
        }

        doConfigMigration(this, appWidgetId)

        binding.showLastUpdateTimeSwitch.setOnClickListener {
            putBoolean(
                this,
                appWidgetId,
                "showLastUpdateTime",
                binding.showLastUpdateTimeSwitch.isChecked
            )

            val appWidgetManager = AppWidgetManager.getInstance(this)
            updateNextClassWidget(this, appWidgetManager, appWidgetId)
        }


        binding.showAsSquareSwitch.setOnClickListener {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
                binding.showAsSquareSwitch.isChecked = false
                AlertDialog.Builder(this)
                    .setTitle("设备不支持")
                    .setMessage("您的系统版本低于Android 12，无法使用此功能")
                    .setPositiveButton(android.R.string.ok, null)
                    .show()
                return@setOnClickListener
            }
            putBoolean(
                this,
                appWidgetId,
                "showAsSquare",
                binding.showAsSquareSwitch.isChecked
            )

            val appWidgetManager = AppWidgetManager.getInstance(this)
            updateNextClassWidget(this, appWidgetManager, appWidgetId)
        }

        binding.showLastUpdateTimeSwitch.isChecked =
            getBoolean(this, appWidgetId, "showLastUpdateTime", false)
        binding.showAsSquareSwitch.isChecked = getBoolean(this, appWidgetId, "showAsSquare", false)

        binding.refreshData.setOnClickListener {
            val appWidgetManager = AppWidgetManager.getInstance(this)
            updateNextClassWidget(this, appWidgetManager, appWidgetId)
            Toast.makeText(this, "已刷新", Toast.LENGTH_SHORT).show()
        }

        binding.toolbar.setNavigationOnClickListener {
            finish()
        }

        binding.toolbar.inflateMenu(R.menu.widget_configuration)
        binding.toolbar.setOnMenuItemClickListener {
            nextClassWidgetUpdate(this)

            val resultValue = Intent()
            resultValue.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
            setResult(RESULT_OK, resultValue)
            finish()
            true
        }
    }

    fun nextClassWidgetUpdate(context: Context) {
        val request = PeriodicWorkRequestBuilder<NextClassUpdateWorker>(
            30, TimeUnit.MINUTES, // 最小间隔（实际可能被系统延长）
            10, TimeUnit.MINUTES  // 容差窗口
        ).build()
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            "NextClassWidgetUpdate",
            ExistingPeriodicWorkPolicy.KEEP, // 保留现有工作，避免重复创建
            request
        )
    }
}