package com.helper.west2ol.fzuhelper

import android.appwidget.AppWidgetManager
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import android.widget.SeekBar
import android.widget.Spinner
import android.widget.AdapterView
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

        binding.foregroundAlphaSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>, view: View?, position: Int, id: Long) {
                when (position) {
                    0 ->{
                        binding.foregroundAlphaSeekbar.isEnabled = false
                        binding.foregroundAlphaSeekbar.progress = 100
                        binding.foregroundAlphaText.text = "100%"
                    }
                    1 ->{
                        binding.foregroundAlphaSeekbar.isEnabled = true
                    }
                    2 ->{
                        binding.foregroundAlphaSeekbar.isEnabled = false
                        binding.foregroundAlphaSeekbar.progress = binding.backgroundAlphaSeekbar.progress
                        binding.foregroundAlphaText.text = "${binding.backgroundAlphaSeekbar.progress}%"
                    }
                }
                saveWidgetConfig(this@CourseScheduleWidgetConfigurationActivity, appWidgetId, "foreground_alpha_mode", position)
                val appWidgetManager = AppWidgetManager.getInstance(this@CourseScheduleWidgetConfigurationActivity)
                updateCourseScheduleWidget(this@CourseScheduleWidgetConfigurationActivity, appWidgetManager, appWidgetId)
            }
            override fun onNothingSelected(parent: AdapterView<*>) {}
        }

        binding.foregroundAlphaSeekbar.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                binding.foregroundAlphaText.text = "$progress%"
                saveWidgetConfig(this@CourseScheduleWidgetConfigurationActivity, appWidgetId, "foreground_alpha", progress)
                val appWidgetManager = AppWidgetManager.getInstance(this@CourseScheduleWidgetConfigurationActivity)
                updateCourseScheduleWidget(this@CourseScheduleWidgetConfigurationActivity, appWidgetManager, appWidgetId)
            }
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {}
        })

        binding.backgroundAlphaSeekbar.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                if (binding.foregroundAlphaSpinner.selectedItemPosition == 2) {
                    binding.foregroundAlphaSeekbar.progress = progress
                }
                binding.backgroundAlphaText.text = "$progress%"
                saveWidgetConfig(this@CourseScheduleWidgetConfigurationActivity, appWidgetId, "background_alpha", progress)
                val appWidgetManager = AppWidgetManager.getInstance(this@CourseScheduleWidgetConfigurationActivity)
                updateCourseScheduleWidget(this@CourseScheduleWidgetConfigurationActivity, appWidgetManager, appWidgetId)
            }
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {}
        })

        binding.backgroundAlphaSeekbar.progress = loadWidgetConfig(this, appWidgetId, "background_alpha", 80)
        binding.backgroundAlphaText.text = "${binding.backgroundAlphaSeekbar.progress}%"

        binding.foregroundAlphaSpinner.setSelection(loadWidgetConfig(this, appWidgetId, "foreground_alpha_mode", 0))
        binding.foregroundAlphaSeekbar.progress = loadWidgetConfig(this, appWidgetId, "foreground_alpha", 100)
        binding.foregroundAlphaText.text = "${binding.foregroundAlphaSeekbar.progress}%"

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