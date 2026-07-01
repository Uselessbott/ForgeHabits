package com.forgehabits.app

import android.content.Context
import android.os.Build
import android.util.Log
import android.widget.Toast
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * React Native native module that exposes startMonkMode, updateMonkMode,
 * and stopMonkMode to TypeScript.
 *
 * Uses the legacy bridge module pattern (ReactContextBaseJavaModule) which
 * is supported in new architecture via the compatibility shim — no codegen
 * spec file is required. This avoids adding a build-time codegen step.
 *
 * All three methods send an explicit Intent to MonkModeService. Using
 * startForegroundService (Android 8+) vs startService (Android <8) is
 * handled automatically.
 */
class MonkModeModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "MonkModeModule"

    @ReactMethod
    fun startMonkMode(remaining: Int) {
        Log.d("MonkMode", "startMonkMode called: " + remaining)
        Toast.makeText(reactContext, "startMonkMode called", Toast.LENGTH_LONG).show()
        val intent = MonkModeService.buildStartIntent(reactContext, remaining)
        startService(reactContext, intent)
    }

    @ReactMethod
    fun updateMonkMode(remaining: Int) {
        val intent = MonkModeService.buildUpdateIntent(reactContext, remaining)
        startService(reactContext, intent)
    }

    @ReactMethod
    fun stopMonkMode() {
        val intent = MonkModeService.buildStopIntent(reactContext)
        reactContext.stopService(intent)
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private fun startService(context: Context, intent: android.content.Intent) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }
    }
}