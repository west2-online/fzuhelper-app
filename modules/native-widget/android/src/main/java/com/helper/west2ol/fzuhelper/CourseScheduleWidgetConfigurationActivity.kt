package com.helper.west2ol.fzuhelper

import android.appwidget.AppWidgetManager
import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import android.widget.SeekBar
import androidx.appcompat.app.AppCompatActivity
import com.west2online.nativewidget.R
import com.west2online.nativewidget.databinding.CourseScheduleWidgetConfigurationBinding


class CourseScheduleWidgetConfigurationActivity : AppCompatActivity() {
    private var appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID
    private lateinit var binding: CourseScheduleWidgetConfigurationBinding

    public override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = CourseScheduleWidgetConfigurationBinding.inflate(layoutInflater)
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

        binding.alphaSeekbar.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                binding.alphaText.text = "$progress%"
                saveWidgetConfig(this@CourseScheduleWidgetConfigurationActivity, appWidgetId, "alpha", progress)
                val appWidgetManager = AppWidgetManager.getInstance(this@CourseScheduleWidgetConfigurationActivity)
                updateCourseScheduleWidget(this@CourseScheduleWidgetConfigurationActivity, appWidgetManager, appWidgetId)
            }
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {}
        })

        binding.alphaSeekbar.progress = loadWidgetConfig(this, appWidgetId, "alpha", 80)
        binding.alphaText.text = "${binding.alphaSeekbar.progress}%"

        binding.refreshData.setOnClickListener {
            val appWidgetManager = AppWidgetManager.getInstance(this)
            updateCourseScheduleWidget(this, appWidgetManager, appWidgetId)
            Toast.makeText(this, "已刷新", Toast.LENGTH_SHORT).show()
        }

        binding.toolbar.setNavigationOnClickListener {
            finish()
        }

        binding.toolbar.inflateMenu(R.menu.widget_configuration)
        binding.toolbar.setOnMenuItemClickListener {
            val resultValue = Intent()
            resultValue.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
            setResult(RESULT_OK, resultValue)
            finish()
            true
        }
    }
}