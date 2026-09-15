package de.riflex.aio.control.host

import android.content.Context
import org.json.JSONObject
import java.util.concurrent.atomic.AtomicLong

/** Security boundary between Android and the embedded AiO runtime. */
class AndroidHeadlessBridge(context: Context) : AutoCloseable {
    private val runtime = AndroidHeadlessRuntime(context.applicationContext)
    private val lastTickAt = AtomicLong(0)

    fun tick(now: Long = System.currentTimeMillis()) {
        lastTickAt.set(now)
        runtime.ensureStarted()
        runtime.flushTelemetry(now)
    }

    fun execute(operation: String, payload: JSONObject = JSONObject()): JSONObject = when (operation) {
        "PING" -> JSONObject().put("ok", true).put("now", System.currentTimeMillis())
        "DEBUG_SNAPSHOT" -> runtime.debugSnapshot()
        "DEBUG_EVENTS" -> runtime.debugEvents(payload.optInt("limit", 100).coerceIn(1, 100))
        "STATUS" -> runtime.status()
        "RESTART_RUNTIME" -> runtime.restart("REMOTE_BOUNDED_RESTART")
        else -> JSONObject().put("ok", false).put("error", "OPERATION_NOT_ALLOWED")
    }

    fun telemetrySnapshot(): JSONObject = runtime.debugSnapshot()
    fun telemetryEvents(limit: Int = 100): JSONObject = runtime.debugEvents(limit.coerceIn(1, 100))
    fun status(): JSONObject = runtime.status().put("bridgeLastTickAt", lastTickAt.get())

    override fun close() = runtime.close()
}
