package com.forgehabits.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder

/**
 * A true Android foreground service for Monk Mode.
 *
 * Foreground services must post a visible notification immediately on start
 * (Android 8+) and must declare FOREGROUND_SERVICE permission in the manifest.
 * They survive app backgrounding and process death unlike JS timers or
 * expo-notifications scheduled notifications.
 *
 * The service is started/updated/stopped via explicit Intents sent from
 * MonkModeModule. It holds no reference to React context intentionally —
 * it is a pure Android component.
 */
class MonkModeService : Service() {

    companion object {
        const val CHANNEL_ID = "forgehabits_monk"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START = "com.forgehabits.app.MONK_START"
        const val ACTION_UPDATE = "com.forgehabits.app.MONK_UPDATE"
        const val ACTION_STOP = "com.forgehabits.app.MONK_STOP"
        const val EXTRA_REMAINING = "remaining"

        fun buildStartIntent(context: Context, remaining: Int): Intent =
            Intent(context, MonkModeService::class.java).apply {
                action = ACTION_START
                putExtra(EXTRA_REMAINING, remaining)
            }

        fun buildUpdateIntent(context: Context, remaining: Int): Intent =
            Intent(context, MonkModeService::class.java).apply {
                action = ACTION_UPDATE
                putExtra(EXTRA_REMAINING, remaining)
            }

        fun buildStopIntent(context: Context): Intent =
            Intent(context, MonkModeService::class.java).apply {
                action = ACTION_STOP
            }
    }

    private lateinit var notificationManager: NotificationManager

    override fun onCreate() {
        super.onCreate()
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        createChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val remaining = intent.getIntExtra(EXTRA_REMAINING, 0)
                // startForeground must be called within 5 seconds of onStartCommand
                startForeground(NOTIFICATION_ID, buildNotification(remaining))
            }
            ACTION_UPDATE -> {
                val remaining = intent.getIntExtra(EXTRA_REMAINING, 0)
                // Update the existing notification in-place without restarting
                notificationManager.notify(NOTIFICATION_ID, buildNotification(remaining))
            }
            ACTION_STOP -> {
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }
        // START_STICKY: if the OS kills the service under memory pressure,
        // restart it with a null intent so the notification re-appears.
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    // ── Private helpers ──────────────────────────────────────────────────────

    private fun createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Monk Mode",
                // HIGH so it appears as a heads-up on first show;
                // subsequent updates are quiet because the channel is already created.
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Monk Mode active notification"
                // Disable sound/vibration for updates — only the first appearance makes noise
                setSound(null, null)
                enableVibration(false)
            }
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(remaining: Int): Notification {
        // Tap the notification to open the app
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, launchIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val title = "🔥 Monk Mode Active"
        val body = when {
            remaining <= 0 -> "All habits complete. Outstanding discipline."
            remaining == 1 -> "1 habit remaining today. Stay focused."
            else -> "$remaining habits remaining today. Stay focused."
        }

        val builder = Notification.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(body)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setOngoing(true)       // Cannot be swiped away — this is what makes it persistent
            .setOnlyAlertOnce(true) // Only make sound/vibrate on the very first show

        return builder.build()
    }
}