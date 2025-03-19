package com.helper.west2ol.fzuhelper

import android.annotation.SuppressLint
import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Bundle
import android.view.View
import android.widget.Switch
import androidx.appcompat.app.AppCompatActivity
import com.helper.west2ol.fzuhelper.updateNextClassWidget


class NextClassWidgetConfigureActivity : AppCompatActivity() {
    private var appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID

    @SuppressLint("UseSwitchCompatOrMaterialCode")
    private lateinit var showLastUpdateTimeSwitch: Switch

    public override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.next_class_widget_configuration)
        setResult(RESULT_CANCELED)

        showLastUpdateTimeSwitch = findViewById(R.id.show_last_update_time_switch)
        findViewById<View>(R.id.confirm_button).setOnClickListener(onClickListener)

        appWidgetId = intent?.extras?.getInt(
            AppWidgetManager.EXTRA_APPWIDGET_ID,
            AppWidgetManager.INVALID_APPWIDGET_ID
        ) ?: AppWidgetManager.INVALID_APPWIDGET_ID

        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish()
            return
        }

        showLastUpdateTimeSwitch.isChecked = loadWidgetConfig(this, appWidgetId, "showLastUpdateTime") == 1
    }

    private var onClickListener = View.OnClickListener {
        val context = this@NextClassWidgetConfigureActivity

        saveWidgetConfig(
            context,
            appWidgetId,
            "showLastUpdateTime",
            if (showLastUpdateTimeSwitch.isChecked) 1 else 0
        )

        val appWidgetManager = AppWidgetManager.getInstance(context)
        updateNextClassWidget(context, appWidgetManager, appWidgetId)

        val resultValue = Intent()
        resultValue.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
        setResult(RESULT_OK, resultValue)
        finish()
    }
}