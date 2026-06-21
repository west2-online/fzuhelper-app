package com.west2online.safeareawebview

import android.os.Build
import android.view.WindowInsets
import com.facebook.react.uimanager.ThemedReactContext
import com.reactnativecommunity.webview.RNCWebView

class SafeAreaWebView(context: ThemedReactContext) : RNCWebView(context) {
  override fun onApplyWindowInsets(insets: WindowInsets): WindowInsets {
    val patchedInsets =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        WindowInsetsApi30.withoutSafeAreaInsets(insets)
      } else {
        @Suppress("DEPRECATION")
        insets.replaceSystemWindowInsets(0, 0, 0, 0)
      }

    return super.onApplyWindowInsets(patchedInsets)
  }
}

private object WindowInsetsApi30 {
  fun withoutSafeAreaInsets(insets: WindowInsets): WindowInsets {
    val none = android.graphics.Insets.NONE
    return WindowInsets.Builder(insets)
      .setInsets(WindowInsets.Type.systemBars(), none)
      .setInsets(WindowInsets.Type.displayCutout(), none)
      .build()
  }
}
