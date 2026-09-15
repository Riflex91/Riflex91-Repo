package de.riflex.aio.control.host

import de.riflex.aio.control.model.ConnectionConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/** Write-only Android telemetry transport. Credentials never enter the WebView. */
class AndroidTelemetryTransport(
    private val config: ConnectionConfig,
    private val botId: String = "android-main"
) {
    suspend fun post(snapshot: JSONObject, events: JSONObject, host: JSONObject, now: Long): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val base = config.baseUrl.trimEnd('/')
            require(base.startsWith("https://")) { "TELEMETRY_HTTPS_REQUIRED" }
            val payload = JSONObject()
                .put("schemaVersion", 1)
                .put("type", "AIO_V3_DEBUG_TELEMETRY_BATCH")
                .put("botId", botId)
                .put("observedAt", now)
                .put("host", host)
                .put("snapshot", snapshot)
                .put("events", events.optJSONArray("events"))
            val connection = (URL("$base/api/v3/debug-telemetry").openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 5_000
                readTimeout = 5_000
                doOutput = true
                setRequestProperty("content-type", "application/json")
                setRequestProperty("x-aio-read-key", config.readKey)
                if (config.adminKey.isNotBlank()) setRequestProperty("x-aio-admin-key", config.adminKey)
                setRequestProperty("x-aio-v3-bot-id", botId)
            }
            connection.outputStream.use { it.write(payload.toString().toByteArray(Charsets.UTF_8)) }
            val status = connection.responseCode
            connection.disconnect()
            check(status in 200..299) { "TELEMETRY_HTTP_$status" }
        }
    }
}
