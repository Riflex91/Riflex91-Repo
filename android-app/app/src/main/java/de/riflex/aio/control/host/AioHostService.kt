package de.riflex.aio.control.host

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import de.riflex.aio.control.data.SecureConfigStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/** Persistent Android owner for the AiO headless runtime and write-only telemetry. */
class AioHostService : Service() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private var supervisorJob: Job? = null
    private lateinit var bridge: AndroidHeadlessBridge

    override fun onCreate() {
        super.onCreate()
        createChannel()
        startForeground(NOTIFICATION_ID, notification("AiO Host startet …"))
        bridge = AndroidHeadlessBridge(applicationContext)
        val config = SecureConfigStore(applicationContext).load()
        val transport = config?.let { AndroidTelemetryTransport(it) }
        supervisorJob = scope.launch {
            var lastTelemetryAttempt = 0L
            while (isActive) {
                val now = System.currentTimeMillis()
                runCatching { bridge.tick(now) }
                if (transport != null && now - lastTelemetryAttempt >= TELEMETRY_INTERVAL_MS) {
                    lastTelemetryAttempt = now
                    val snapshot = runCatching { bridge.telemetrySnapshot() }.getOrNull()
                    val events = runCatching { bridge.telemetryEvents() }.getOrNull()
                    if (snapshot != null && events != null && snapshot.optBoolean("ok", true)) {
                        transport.post(snapshot, events, bridge.status(), now)
                    }
                }
                delay(SUPERVISOR_INTERVAL_MS)
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int = START_STICKY

    override fun onDestroy() {
        supervisorJob?.cancel()
        bridge.close()
        scope.coroutineContext[Job]?.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createChannel() {
        getSystemService(NotificationManager::class.java).createNotificationChannel(
            NotificationChannel(CHANNEL_ID, "AiO Bot Host", NotificationManager.IMPORTANCE_LOW)
        )
    }

    private fun notification(text: String) = NotificationCompat.Builder(this, CHANNEL_ID)
        .setSmallIcon(android.R.drawable.stat_notify_sync)
        .setContentTitle("AiO Bot Host")
        .setContentText(text)
        .setOngoing(true)
        .build()

    companion object {
        const val CHANNEL_ID = "aio_host"
        const val NOTIFICATION_ID = 3107
        const val SUPERVISOR_INTERVAL_MS = 5_000L
        const val TELEMETRY_INTERVAL_MS = 15_000L
    }
}
