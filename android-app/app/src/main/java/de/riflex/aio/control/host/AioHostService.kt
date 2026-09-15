package de.riflex.aio.control.host

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import de.riflex.aio.control.R
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * Persistent Android owner for the AiO headless runtime and bridge.
 *
 * The service deliberately does not expose arbitrary remote code execution.
 * Headless operations must pass through [AndroidHeadlessBridge]'s allow-list.
 */
class AioHostService : Service() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private var supervisorJob: Job? = null
    private lateinit var bridge: AndroidHeadlessBridge

    override fun onCreate() {
        super.onCreate()
        createChannel()
        startForeground(NOTIFICATION_ID, notification("AiO Host startet …"))
        bridge = AndroidHeadlessBridge(applicationContext)
        supervisorJob = scope.launch {
            while (isActive) {
                runCatching { bridge.tick() }
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
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(
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
    }
}
