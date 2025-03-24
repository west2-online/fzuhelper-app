package com.helper.west2ol.fzuhelper

import android.appwidget.AppWidgetManager
import android.os.Build
import android.os.Bundle
import android.widget.TextView
import android.widget.Toast
import android.widget.Toolbar
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.SwitchCompat
import com.west2online.nativewidget.databinding.NextClassWidgetConfigurationBinding


class NextClassWidgetConfigureActivity : AppCompatActivity() {
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
            finish()
            return
        }

        binding.showLastUpdateTimeSwitch.setOnClickListener {
            saveWidgetConfig(
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
            saveWidgetConfig(
                this,
                appWidgetId,
                "showAsSquare",
                binding.showAsSquareSwitch.isChecked
            )

            val appWidgetManager = AppWidgetManager.getInstance(this)
            updateNextClassWidget(this, appWidgetManager, appWidgetId)
        }

        binding.showLastUpdateTimeSwitch.isChecked =
            loadWidgetConfig(this, appWidgetId, "showLastUpdateTime")
        binding.showAsSquareSwitch.isChecked = loadWidgetConfig(this, appWidgetId, "showAsSquare")

        binding.refreshData.setOnClickListener {
            val appWidgetManager = AppWidgetManager.getInstance(this)
            updateNextClassWidget(this, appWidgetManager, appWidgetId)
            Toast.makeText(this, "已刷新", Toast.LENGTH_SHORT).show()
        }

        binding.toolbar.setNavigationOnClickListener {
            finish()
        }
    }

}