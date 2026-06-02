package com.west2online.safeareawebview

import android.graphics.Insets
import android.os.Build
import android.view.WindowInsets
import com.facebook.react.uimanager.ThemedReactContext
import com.reactnativecommunity.webview.RNCWebView

class SafeAreaWebView(context: ThemedReactContext) : RNCWebView(context) {
  override fun onApplyWindowInsets(insets: WindowInsets): WindowInsets {
    return super.onApplyWindowInsets(insets.withoutSafeAreaInsets())
  }

  private fun WindowInsets.withoutSafeAreaInsets(): WindowInsets {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      WindowInsets.Builder(this)
        .setInsets(WindowInsets.Type.systemBars(), Insets.NONE)
        .setInsets(WindowInsets.Type.displayCutout(), Insets.NONE)
        .build()
    } else {
      @Suppress("DEPRECATION")
      replaceSystemWindowInsets(0, 0, 0, 0)
    }
  }
}
