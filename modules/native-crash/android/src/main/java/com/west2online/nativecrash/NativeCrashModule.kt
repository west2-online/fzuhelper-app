package com.west2online.nativecrash

import expo.modules.BuildConfig
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NativeCrashModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("NativeCrash")

        Function("crash") { message: String ->
            throw RuntimeException(message)
            return@Function
        }
    }
}
