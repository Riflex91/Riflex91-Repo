package de.riflex.aio.control.host

import android.content.Context
import de.riflex.aio.control.clientless.NativeClientlessConfigStore
import de.riflex.aio.control.clientless.NativeClientlessManager
import org.json.JSONArray
import org.json.JSONObject

/** Supervised browser-free Android owner for native Adventure Land sessions. */
class AndroidHeadlessRuntime(context: Context) : AutoCloseable {
    private val appContext = context.applicationContext
    private var manager: NativeClientlessManager? = null
    @Volatile private var running = false
    @Volatile private var startedAt = 0L
    @Volatile private var restartCount = 0
    @Volatile private var lastTelemetryAt = 0L
    private val events = ArrayDeque<JSONObject>()

    @Synchronized fun ensureStarted() {
        if (running) return
        val config = NativeClientlessConfigStore(appContext).load()
        if (config == null || config.characters.isEmpty()) {
            event("NATIVE_CLIENTLESS_CONFIG_REQUIRED", "WARNING")
            return
        }
        manager = NativeClientlessManager(config).also { it.start() }
        running = true; startedAt = System.currentTimeMillis()
        event("ANDROID_NATIVE_CLIENTLESS_STARTED", "INFO")
    }

    @Synchronized fun restart(reason: String): JSONObject {
        manager?.close(); manager = null; running = false; restartCount += 1
        event("ANDROID_NATIVE_CLIENTLESS_RESTART", "WARNING", reason); ensureStarted(); return status()
    }

    fun flushTelemetry(now: Long) { if (running) lastTelemetryAt = now }
    fun debugSnapshot(): JSONObject = manager?.status() ?: JSONObject().put("ok", false).put("error", "NATIVE_CLIENTLESS_NOT_CONFIGURED")
    fun debugEvents(limit: Int): JSONObject {
        val rows = JSONArray(); synchronized(this) { events.takeLast(limit).forEach { rows.put(JSONObject(it.toString())) } }
        return JSONObject().put("ok", true).put("events", rows)
    }
    fun status(): JSONObject = (manager?.status() ?: JSONObject().put("ok", true).put("sessionCount", 0))
        .put("running", running).put("startedAt", startedAt).put("restartCount", restartCount)
        .put("lastTelemetryAt", lastTelemetryAt).put("runtime", "android-native-clientless").put("browser", false)

    @Synchronized private fun event(name: String, severity: String, reason: String? = null) {
        val row = JSONObject().put("event", name).put("severity", severity).put("eventAt", System.currentTimeMillis())
        if (reason != null) row.put("reason", reason); events.addLast(row); while (events.size > 100) events.removeFirst()
    }
    override fun close() { running = false; manager?.close(); manager = null }
}
