package de.riflex.aio.control.host

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * Lifecycle boundary for the embedded Adventure Land runtime.
 *
 * Phase one establishes supervision, bounded operations and telemetry ownership.
 * The actual game WebView/JS adapter is intentionally isolated behind this class
 * so the control UI and bridge never gain arbitrary script execution authority.
 */
class AndroidHeadlessRuntime(private val context: Context) : AutoCloseable {
    @Volatile private var running = false
    @Volatile private var startedAt = 0L
    @Volatile private var restartCount = 0
    @Volatile private var lastTelemetryAt = 0L
    private val events = ArrayDeque<JSONObject>()

    @Synchronized
    fun ensureStarted() {
        if (running) return
        running = true
        startedAt = System.currentTimeMillis()
        event("ANDROID_RUNTIME_STARTED", "INFO")
    }

    @Synchronized
    fun restart(reason: String): JSONObject {
        running = false
        restartCount += 1
        event("ANDROID_RUNTIME_RESTART", "WARNING", reason)
        ensureStarted()
        return status()
    }

    fun flushTelemetry(now: Long) {
        if (!running) return
        // Transport ownership lives here. A subsequent adapter wires this snapshot
        // to the existing authenticated telemetry endpoint without storing secrets
        // in source control.
        lastTelemetryAt = now
    }

    fun debugSnapshot(): JSONObject = JSONObject()
        .put("ok", true)
        .put("source", "android-headless")
        .put("status", status())

    @Synchronized
    fun debugEvents(limit: Int): JSONObject {
        val rows = JSONArray()
        events.takeLast(limit).forEach { rows.put(JSONObject(it.toString())) }
        return JSONObject().put("ok", true).put("events", rows)
    }

    fun status(): JSONObject = JSONObject()
        .put("ok", true)
        .put("running", running)
        .put("startedAt", startedAt)
        .put("restartCount", restartCount)
        .put("lastTelemetryAt", lastTelemetryAt)
        .put("runtime", "android-headless")

    @Synchronized
    private fun event(name: String, severity: String, reason: String? = null) {
        val row = JSONObject()
            .put("event", name)
            .put("severity", severity)
            .put("eventAt", System.currentTimeMillis())
        if (reason != null) row.put("reason", reason)
        events.addLast(row)
        while (events.size > 100) events.removeFirst()
    }

    override fun close() {
        running = false
    }
}
