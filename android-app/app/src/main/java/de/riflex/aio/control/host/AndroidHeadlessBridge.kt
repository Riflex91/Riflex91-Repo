package de.riflex.aio.control.host

import android.content.Context
import org.json.JSONObject
import java.util.concurrent.atomic.AtomicLong

/**
 * Security boundary between Android and the embedded AiO runtime.
 *
 * Remote callers may request only known diagnostic/control operations. Payloads
 * are data, never executable source. This keeps the Android host compatible with
 * the existing headless protocol without adding a remote-code channel.
 */
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

    fun status(): JSONObject = runtime.status().put("bridgeLastTickAt", lastTickAt.get())

    override fun close() = runtime.close()
}
