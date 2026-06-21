package com.west2online.safeareawebview

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.reactnativecommunity.webview.BuildConfig
import com.reactnativecommunity.webview.RNCWebViewManager
import com.reactnativecommunity.webview.RNCWebViewManagerImpl
import com.reactnativecommunity.webview.RNCWebViewWrapper

@ReactModule(name = SafeAreaWebViewManager.REACT_CLASS)
class SafeAreaWebViewManager : RNCWebViewManager() {
  companion object {
    const val REACT_CLASS = "FzuSafeAreaWebView"
  }

  private val managerImpl = RNCWebViewManagerImpl(BuildConfig.IS_NEW_ARCHITECTURE_ENABLED)

  override fun getName(): String = REACT_CLASS

  public override fun createViewInstance(context: ThemedReactContext): RNCWebViewWrapper {
    return managerImpl.createViewInstance(context, SafeAreaWebView(context))
  }
}
