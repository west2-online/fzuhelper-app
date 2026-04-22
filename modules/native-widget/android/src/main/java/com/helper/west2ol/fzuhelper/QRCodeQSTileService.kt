package com.helper.west2ol.fzuhelper

import android.annotation.SuppressLint
import android.app.PendingIntent
import android.content.Intent
import android.os.Build
import android.service.quicksettings.TileService
import androidx.core.net.toUri

class QRCodeQSTileService : TileService() {
    override fun onClick() {
        super.onClick()

        val intent = Intent().apply {
            action = Intent.ACTION_VIEW
            // 需要跳到开屏页初始化
            data = "(guest)?target=/qrcode".toUri()
            setClassName(
                "com.helper.west2ol.fzuhelper",
                "com.helper.west2ol.fzuhelper.MainActivity"
            )
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            val pendingIntent = PendingIntent.getActivity(
                this, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            startActivityAndCollapse(pendingIntent)
        } else {
            @Suppress("DEPRECATION")
            @SuppressLint("StartActivityAndCollapseDeprecated")
            startActivityAndCollapse(intent)
        }
    }
}
