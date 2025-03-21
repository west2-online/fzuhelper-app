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
import com.west2online.nativewidget.R


class NextClassWidgetConfigureActivity : AppCompatActivity() {
    private var appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID

    private lateinit var showLastUpdateTimeSwitch: SwitchCompat
    private lateinit var showAsSquareSwitch: SwitchCompat

    public override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.next_class_widget_configuration)

        appWidgetId = intent?.extras?.getInt(
            AppWidgetManager.EXTRA_APPWIDGET_ID,
            AppWidgetManager.INVALID_APPWIDGET_ID
        ) ?: AppWidgetManager.INVALID_APPWIDGET_ID

        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish()
            return
        }

        showLastUpdateTimeSwitch = findViewById(R.id.show_last_update_time_switch)
        showLastUpdateTimeSwitch.setOnClickListener {
            saveWidgetConfig(
                this,
                appWidgetId,
                "showLastUpdateTime",
                showLastUpdateTimeSwitch.isChecked
            )

            val appWidgetManager = AppWidgetManager.getInstance(this)
            updateNextClassWidget(this, appWidgetManager, appWidgetId)
        }

        showAsSquareSwitch = findViewById(R.id.show_as_square)
        showAsSquareSwitch.setOnClickListener {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
                showAsSquareSwitch.isChecked = false
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
                showAsSquareSwitch.isChecked
            )

            val appWidgetManager = AppWidgetManager.getInstance(this)
            updateNextClassWidget(this, appWidgetManager, appWidgetId)
        }

        showLastUpdateTimeSwitch.isChecked =
            loadWidgetConfig(this, appWidgetId, "showLastUpdateTime")
        showAsSquareSwitch.isChecked = loadWidgetConfig(this, appWidgetId, "showAsSquare")

        findViewById<TextView>(R.id.refresh_data).setOnClickListener {
            val appWidgetManager = AppWidgetManager.getInstance(this)
            updateNextClassWidget(this, appWidgetManager, appWidgetId)
            Toast.makeText(this, "已刷新", Toast.LENGTH_SHORT).show()
        }

        findViewById<Toolbar>(R.id.toolbar).setNavigationOnClickListener {
            finish()
        }
    }

}