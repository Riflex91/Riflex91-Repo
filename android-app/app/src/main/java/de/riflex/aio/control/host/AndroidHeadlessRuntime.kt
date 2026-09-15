package de.riflex.aio.control.host

import android.content.Context
import de.riflex.aio.control.clientless.BotLogicUpdater
import de.riflex.aio.control.clientless.NativeClientlessConfigStore
import de.riflex.aio.control.clientless.NativeClientlessManager
import org.json.JSONArray
import org.json.JSONObject

/** Supervised browser-free Android owner for native Adventure Land sessions. */
class AndroidHeadlessRuntime(context: Context) : AutoCloseable {
    private val appContext = context.applicationContext
    private val logicUpdater = BotLogicUpdater(appContext)
    private var manager: NativeClientlessManager? = null
    @Volatile private var running = false
    @Volatile private var startedAt = 0L
    @Volatile private var restartCount = 0
    @Volatile private var lastTelemetryAt = 0L
    @Volatile private var lastLogicCheckAt = 0L
    @Volatile private var logicVersion: String? = null
    @Volatile private var logicUpdateError: String? = null
    private val events = ArrayDeque<JSONObject>()

    @Synchronized fun ensureStarted() {
        if (running) return
        refreshLogic(force = true)
        val config = NativeClientlessConfigStore(appContext).load()
        if (config == null || config.characters.isEmpty()) {
            event("NATIVE_CLIENTLESS_CONFIG_REQUIRED", "WARNING")
            return
        }
        manager = NativeClientlessManager(config, logicUpdater.active()).also { it.start() }
        running = true; startedAt = System.currentTimeMillis()
        event("ANDROID_NATIVE_CLIENTLESS_STARTED", "INFO")
    }

    @Synchronized fun refreshLogic(force: Boolean = false) {
        val now = System.currentTimeMillis()
        if (!force && now - lastLogicCheckAt < LOGIC_CHECK_INTERVAL_MS) return
        lastLogicCheckAt = now
        val result = logicUpdater.checkNow()
        logicVersion = result.version
        logicUpdateError = result.error
        if (result.changed) {
            event("BOT_LOGIC_UPDATED", "INFO", result.version)
            if (running) {
                manager?.close()
                val config = NativeClientlessConfigStore(appContext).load()
                manager = if (config != null && config.characters.isNotEmpty()) {
                    NativeClientlessManager(config, logicUpdater.active()).also { it.start() }
                } else null
            }
        } else if (result.error != null) {
            event("BOT_LOGIC_UPDATE_FAILED", "WARNING", result.error)
        }
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
        .put("logicVersion", logicVersion ?: JSONObject.NULL).put("lastLogicCheckAt", lastLogicCheckAt)
        .put("logicUpdateError", logicUpdateError ?: JSONObject.NULL)

    @Synchronized private fun event(name: String, severity: String, reason: String? = null) {
        val row = JSONObject().put("event", name).put("severity", severity).put("eventAt", System.currentTimeMillis())
        if (reason != null) row.put("reason", reason); events.addLast(row); while (events.size > 100) events.removeFirst()
    }
    override fun close() { running = false; manager?.close(); manager = null }

    companion object { const val LOGIC_CHECK_INTERVAL_MS = 5 * 60_000L }
}
