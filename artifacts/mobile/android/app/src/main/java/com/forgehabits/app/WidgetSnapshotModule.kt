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
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.launch

// Bridge module exposed to JS as NativeModules.WidgetSnapshotModule.
// This is the ONLY place JS talks to native widget storage - it has no
// knowledge of habit data itself, it just persists whatever JSON string
// HabitsContext.refreshWidget() gives it. All snapshot computation stays
// in JS; this module is purely a write pipe into DataStore.
class WidgetSnapshotModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val moduleScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    // Only the most recent write should ever apply. If a newer writeSnapshot()
    // call comes in while an older one is still in flight, the older one is
    // cancelled so it can never call updateAll() with stale data after the
    // newer one has already landed.
    private var pendingWrite: Job? = null

    override fun getName(): String = "WidgetSnapshotModule"

    @ReactMethod
    fun writeSnapshot(snapshotJson: String, promise: Promise) {
        // Cancel any write still in flight - only the newest call should
        // ever be allowed to reach DataStore/updateAll(). This prevents
        // out-of-order completions from clobbering fresher data with stale
        // data (the "shows 2 completed instead of 5" bug).
        pendingWrite?.cancel()
        pendingWrite = moduleScope.launch {
            try {
                WidgetSnapshotRepository.write(reactApplicationContext, snapshotJson)
                ensureActive()
                ProgressGlanceWidget().updateAll(reactApplicationContext)
                TasksGlanceWidget().updateAll(reactApplicationContext)
                CombinedGlanceWidget().updateAll(reactApplicationContext)
                HeatmapGlanceWidget().updateAll(reactApplicationContext)
                promise.resolve(true)
            } catch (e: CancellationException) {
                // Superseded by a newer write - not an error, just drop it.
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
