package com.helper.west2ol.fzuhelper

import android.appwidget.AppWidgetManager
import android.os.Bundle
import android.view.View
import android.widget.Toolbar
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.SwitchCompat


class NextClassWidgetConfigureActivity : AppCompatActivity() {
    private var appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID

    private lateinit var showLastUpdateTimeSwitch: SwitchCompat

    public override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.next_class_widget_configuration)

        showLastUpdateTimeSwitch = findViewById(R.id.show_last_update_time_switch)
        showLastUpdateTimeSwitch.setOnClickListener(onClickListener)

        appWidgetId = intent?.extras?.getInt(
            AppWidgetManager.EXTRA_APPWIDGET_ID,
            AppWidgetManager.INVALID_APPWIDGET_ID
        ) ?: AppWidgetManager.INVALID_APPWIDGET_ID

        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish()
            return
        }

        showLastUpdateTimeSwitch.isChecked =
            loadWidgetConfig(this, appWidgetId, "showLastUpdateTime")

        findViewById<Toolbar>(R.id.toolbar).setNavigationOnClickListener {
            finish()
        }
    }

    private var onClickListener = View.OnClickListener {
        val context = this@NextClassWidgetConfigureActivity

        saveWidgetConfig(
            context,
            appWidgetId,
            "showLastUpdateTime",
            showLastUpdateTimeSwitch.isChecked
        )

        val appWidgetManager = AppWidgetManager.getInstance(context)
        updateNextClassWidget(context, appWidgetManager, appWidgetId)
    }
}