package com.forgehabits.app

import androidx.glance.appwidget.updateAll
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.forgehabits.app.glance.CombinedGlanceWidget
import com.forgehabits.app.glance.HeatmapGlanceWidget
import com.forgehabits.app.glance.ProgressGlanceWidget
import com.forgehabits.app.glance.TasksGlanceWidget
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

// Bridge module exposed to JS as NativeModules.WidgetSnapshotModule.
// This is the ONLY place JS talks to native widget storage - it has no
// knowledge of habit data itself, it just persists whatever JSON string
// HabitsContext.refreshWidget() gives it. All snapshot computation stays
// in JS; this module is purely a write pipe into DataStore.
class WidgetSnapshotModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val moduleScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun getName(): String = "WidgetSnapshotModule"

    @ReactMethod
    fun writeSnapshot(snapshotJson: String, promise: Promise) {
        moduleScope.launch {
            try {
                WidgetSnapshotRepository.write(reactApplicationContext, snapshotJson)
                // Tell every Glance widget class to recompose immediately.
                // This is the piece that was missing before: writing to
                // DataStore alone does not repaint an already-placed widget -
                // updateAll() is what actually triggers the redraw.
                ProgressGlanceWidget().updateAll(reactApplicationContext)
                TasksGlanceWidget().updateAll(reactApplicationContext)
                CombinedGlanceWidget().updateAll(reactApplicationContext)
                HeatmapGlanceWidget().updateAll(reactApplicationContext)
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("WIDGET_SNAPSHOT_WRITE_FAILED", e.message, e)
            }
        }
    }

    override fun invalidate() {
        super.invalidate()
        moduleScope.cancel()
    }
}
