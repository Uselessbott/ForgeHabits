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
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*

class MonkModeService : Service() {

    companion object {
        const val CHANNEL_ID = "forgehabits_monk"
        const val NOTIFICATION_ID = 1001

        const val ACTION_START = "com.forgehabits.app.MONK_START"
        const val ACTION_UPDATE = "com.forgehabits.app.MONK_UPDATE"
        const val ACTION_STOP = "com.forgehabits.app.MONK_STOP"
        const val ACTION_REFRESH = "com.forgehabits.app.MONK_REFRESH"

        const val EXTRA_REMAINING = "remaining"
        const val ACTION_MONK_MODE_UPDATE = "com.forgehabits.app.MONK_MODE_UPDATE"

        private const val REQUEST_CODE_COMPLETE_CURRENT = 100
        private const val REQUEST_CODE_STOP = 101
        private const val REQUEST_CODE_OPEN_APP = 102

        fun buildStartIntent(context: Context, remaining: Int): Intent =
            Intent(context, MonkModeService::class.java).apply {
                action = ACTION_START
                putExtra(EXTRA_REMAINING, remaining)
            }

        fun buildStopIntent(context: Context): Intent =
            Intent(context, MonkModeService::class.java).apply {
                action = ACTION_STOP
            }
    }

    private lateinit var notificationManager: NotificationManager
    private lateinit var session: MonkModeSession
    private val dateProvider = SystemDateProvider()
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onCreate() {
        super.onCreate()
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        session = MonkModeSession.getInstance(this)
        createChannel()

        // Post temporary notification immediately (Android requires startForeground
        // within 5 seconds). The real notification replaces this within milliseconds.
        startForeground(NOTIFICATION_ID, buildTemporaryNotification())

        // Rebuild from DataStore if a valid session exists
        serviceScope.launch {
            val state = session.getValidState()
            if (state != null) {
                updateNotification(state)
                broadcastUpdate()
            } else {
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                serviceScope.launch {
                    val state = session.getValidState()
                    if (state != null) {
                        updateNotification(state)
                    }
                }
            }
            ACTION_UPDATE -> {
                serviceScope.launch {
                    val state = session.getValidState()
                    if (state != null) {
                        updateNotification(state)
                        broadcastUpdate()
                    }
                }
            }
            ACTION_REFRESH -> {
                serviceScope.launch {
                    val state = session.getValidState()
                    if (state != null) {
                        updateNotification(state)
                        broadcastUpdate()
                    }
                }
            }
            ACTION_STOP -> {
                serviceScope.launch {
                    session.stopSession()
                }
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }

        return START_STICKY
    }

    override fun onDestroy() {
        serviceScope.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    // ── Notification ────────────────────────────────────────────────────

    private fun createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Monk Mode",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Monk Mode active notification"
                setSound(null, null)
                enableVibration(false)
                setShowBadge(false)
            }
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun buildTemporaryNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("\uD83D\uDD25 Monk Mode")
            .setContentText("Starting...")
            .setSmallIcon(R.drawable.ic_monk_mode)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .build()
    }

    private suspend fun updateNotification(state: MonkModeState) {
        withContext(Dispatchers.Main) {
            notificationManager.notify(NOTIFICATION_ID, buildNotification(state))
        }
    }

    private fun broadcastUpdate() {
        val intent = Intent(ACTION_MONK_MODE_UPDATE)
        intent.setPackage(packageName)
        sendBroadcast(intent)
    }

    private fun buildNotification(state: MonkModeState): Notification {
        val habits = state.habitsList
        val currentHabit = habits.firstOrNull { !it.completed }
        val completedCount = habits.count { it.completed }
        val totalCount = habits.size
        val allCompleted = totalCount > 0 && completedCount >= totalCount

        // COMPLETE button — includes both habitId AND sessionDate for validation
        val completeIntent = Intent(this, MonkModeActionReceiver::class.java).apply {
            putExtra("habitId", currentHabit?.id ?: "")
            putExtra("sessionDate", state.sessionDate)
        }
        val completePendingIntent = PendingIntent.getBroadcast(
            this, REQUEST_CODE_COMPLETE_CURRENT, completeIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        // STOP button
        val stopPendingIntent = PendingIntent.getService(
            this, REQUEST_CODE_STOP, buildStopIntent(this),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        // Tap notification → open app
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        val launchPendingIntent = PendingIntent.getActivity(
            this, REQUEST_CODE_OPEN_APP, launchIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("\uD83D\uDD25 Monk Mode")
            .setSmallIcon(R.drawable.ic_monk_mode)
            .setContentIntent(launchPendingIntent)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)

        when {
            currentHabit != null -> {
                builder.setContentText("\uD83D\uDCD6 ${currentHabit.name}")
                builder.setSubText("\u2713 $completedCount / $totalCount Complete")
                builder.addAction(
                    android.R.drawable.ic_input_add,
                    "\u2713 COMPLETE",
                    completePendingIntent
                )
            }
            allCompleted -> {
                builder.setContentText("\uD83C\uDF89 All habits completed!")
                builder.setSubText("\u2713 $completedCount / $totalCount Complete")
            }
            else -> {
                builder.setContentText("Loading habits...")
            }
        }

        builder.addAction(
            android.R.drawable.ic_delete,
            "\u23F9 STOP",
            stopPendingIntent
        )

        return builder.build()
    }
}
