package de.riflex.aio.control.host

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/** Supervised Android owner for the Adventure Land WebView runtime. */
class AndroidHeadlessRuntime(context: Context) : AutoCloseable {
    private val webRuntime = AdventureLandWebRuntime(context.applicationContext)
    @Volatile private var running = false
    @Volatile private var startedAt = 0L
    @Volatile private var restartCount = 0
    @Volatile private var lastTelemetryAt = 0L
    private val events = ArrayDeque<JSONObject>()

    @Synchronized
    fun ensureStarted() {
        if (running) return
        webRuntime.start()
        running = true
        startedAt = System.currentTimeMillis()
        event("ANDROID_RUNTIME_STARTED", "INFO")
    }

    @Synchronized
    fun restart(reason: String): JSONObject {
        webRuntime.close()
        running = false
        restartCount += 1
        event("ANDROID_RUNTIME_RESTART", "WARNING", reason)
        ensureStarted()
        return status()
    }

    fun flushTelemetry(now: Long) {
        if (!running) return
        // Keep the host heartbeat active even before the external telemetry transport
        // is configured. Failures are represented in status rather than executing
        // arbitrary recovery code in the browser context.
        val heartbeat = webRuntime.evaluateAllowed("HOST_HEARTBEAT")
        if (heartbeat.optBoolean("ok", false)) lastTelemetryAt = now
    }

    fun debugSnapshot(): JSONObject {
        if (!running) return JSONObject().put("ok", false).put("error", "ANDROID_RUNTIME_STOPPED")
        val response = webRuntime.evaluateAllowed("DEBUG_SNAPSHOT")
        return if (response.optBoolean("ok", false)) response.optJSONObject("value") ?: response else response
    }

    fun debugEvents(limit: Int): JSONObject {
        if (!running) return JSONObject().put("ok", false).put("error", "ANDROID_RUNTIME_STOPPED")
        val response = webRuntime.evaluateAllowed("DEBUG_EVENTS", JSONObject().put("limit", limit))
        if (response.optBoolean("ok", false)) return response.optJSONObject("value") ?: response
        val rows = JSONArray()
        synchronized(this) { events.takeLast(limit).forEach { rows.put(JSONObject(it.toString())) } }
        return JSONObject().put("ok", false).put("error", response.optString("error")).put("events", rows)
    }

    fun status(): JSONObject = JSONObject()
        .put("ok", true)
        .put("running", running)
        .put("startedAt", startedAt)
        .put("restartCount", restartCount)
        .put("lastTelemetryAt", lastTelemetryAt)
        .put("runtime", "android-webview-headless")
        .put("web", webRuntime.status())

    @Synchronized
    private fun event(name: String, severity: String, reason: String? = null) {
        val row = JSONObject().put("event", name).put("severity", severity).put("eventAt", System.currentTimeMillis())
        if (reason != null) row.put("reason", reason)
        events.addLast(row)
        while (events.size > 100) events.removeFirst()
    }

    override fun close() {
        running = false
        webRuntime.close()
    }
}
