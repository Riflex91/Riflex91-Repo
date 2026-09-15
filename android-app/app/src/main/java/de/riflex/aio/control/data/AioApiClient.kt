package de.riflex.aio.control.data

import de.riflex.aio.control.model.CharacterStatus
import de.riflex.aio.control.model.ConnectionConfig
import de.riflex.aio.control.model.DatabaseStats
import de.riflex.aio.control.model.EventItem
import de.riflex.aio.control.model.Overview
import de.riflex.aio.control.model.SettingItem
import de.riflex.aio.control.model.SettingsPayload
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

class AioApiClient {
    suspend fun overview(config: ConnectionConfig): Overview = withContext(Dispatchers.IO) {
        val root = request(config, "GET", "/api/v3/overview?account=${enc(config.account)}")
        val rows = root.optJSONArray("characters") ?: JSONArray()
        val characters = buildList {
            for (i in 0 until rows.length()) {
                val row = rows.optJSONObject(i) ?: continue
                val status = row.optJSONObject("status") ?: JSONObject()
                val c = status.optJSONObject("character") ?: JSONObject()
                add(
                    CharacterStatus(
                        name = row.optString("character", c.optString("name", "?")),
                        ctype = c.optString("ctype", "unknown"),
                        level = c.optInt("level", 0),
                        map = c.optString("map", "?"),
                        hp = c.optLong("hp", 0),
                        maxHp = c.optLong("max_hp", 0),
                        mp = c.optLong("mp", 0),
                        maxMp = c.optLong("max_mp", 0),
                        gold = c.optLong("gold", 0),
                        rip = c.optBoolean("rip", false),
                        mode = status.optString("mode", "unknown"),
                        connectionState = row.optString("connectionState", "offline"),
                        ageSeconds = row.optLong("ageSeconds", Long.MAX_VALUE),
                        receivedAt = row.optLong("receivedAt", 0)
                    )
                )
            }
        }
        val db = root.optJSONObject("database") ?: JSONObject()
        val settings = root.optJSONObject("settings") ?: JSONObject()
        Overview(
            now = root.optLong("now", System.currentTimeMillis()),
            account = root.optString("account", config.account),
            characters = characters,
            database = DatabaseStats(
                runtimeStatuses = db.optLong("runtimeStatuses", 0),
                events = db.optLong("events", 0),
                settingAudits = db.optLong("settingAudits", 0)
            ),
            settingsRevision = settings.optLong("revision", 0)
        )
    }

    suspend fun events(config: ConnectionConfig, limit: Int = 80): List<EventItem> = withContext(Dispatchers.IO) {
        val root = request(config, "GET", "/api/v3/events?account=${enc(config.account)}&limit=${limit.coerceIn(10, 120)}")
        val rows = root.optJSONArray("events") ?: JSONArray()
        buildList {
            for (i in 0 until rows.length()) {
                val row = rows.optJSONObject(i) ?: continue
                add(
                    EventItem(
                        character = row.optString("character", "?"),
                        severity = row.optString("severity", "info").lowercase(),
                        component = row.optString("component", ""),
                        event = row.optString("event", "Event"),
                        reason = row.optString("reason", ""),
                        eventAt = row.optLong("eventAt", 0)
                    )
                )
            }
        }
    }

    suspend fun settings(config: ConnectionConfig): SettingsPayload = withContext(Dispatchers.IO) {
        parseSettings(request(config, "GET", "/api/v3/settings?account=${enc(config.account)}"))
    }

    suspend fun patchSetting(config: ConnectionConfig, revision: Long, key: String, value: Any): SettingsPayload = withContext(Dispatchers.IO) {
        require(config.adminKey.isNotBlank()) { "ADMIN_KEY fehlt" }
        val body = JSONObject()
            .put("account", config.account)
            .put("expectedRevision", revision)
            .put("patch", JSONObject().put(key, value))
        parseSettings(request(config, "PATCH", "/api/v3/settings", body))
    }

    private fun parseSettings(root: JSONObject): SettingsPayload {
        val schema = root.optJSONArray("schema") ?: JSONArray()
        val settings = root.optJSONObject("settings") ?: JSONObject()
        val values = settings.optJSONObject("values") ?: JSONObject()
        val items = buildList {
            for (i in 0 until schema.length()) {
                val row = schema.optJSONObject(i) ?: continue
                val key = row.optString("key")
                if (key.isBlank()) continue
                val choices = row.optJSONArray("values")
                val choiceList = buildList {
                    if (choices != null) for (j in 0 until choices.length()) add(choices.optString(j))
                }
                val raw = if (values.has(key)) values.opt(key) else row.opt("default")
                add(
                    SettingItem(
                        key = key,
                        category = row.optString("category", "Sonstiges"),
                        label = row.optString("label", key),
                        description = row.optString("description", ""),
                        type = row.optString("type", "string"),
                        locked = row.optBoolean("locked", false),
                        hot = row.optBoolean("hot", false),
                        min = row.optDoubleOrNull("min"),
                        max = row.optDoubleOrNull("max"),
                        step = row.optDoubleOrNull("step"),
                        values = choiceList,
                        value = if (raw == JSONObject.NULL) null else raw
                    )
                )
            }
        }
        return SettingsPayload(
            revision = settings.optLong("revision", 0),
            items = items,
            updatedAt = settings.optLong("updatedAt", 0)
        )
    }

    private fun request(config: ConnectionConfig, method: String, path: String, body: JSONObject? = null): JSONObject {
        val base = config.baseUrl.trim().trimEnd('/')
        require(base.startsWith("https://")) { "Nur HTTPS Worker-URLs sind erlaubt" }
        val connection = URL(base + path).openConnection() as HttpURLConnection
        try {
            connection.requestMethod = method
            connection.connectTimeout = 10_000
            connection.readTimeout = 12_000
            connection.useCaches = false
            connection.setRequestProperty("Accept", "application/json")
            connection.setRequestProperty("x-aio-read-key", config.readKey)
            if (method == "PATCH") connection.setRequestProperty("x-aio-admin-key", config.adminKey)
            if (body != null) {
                connection.doOutput = true
                connection.setRequestProperty("Content-Type", "application/json; charset=utf-8")
                connection.outputStream.use { it.write(body.toString().toByteArray(Charsets.UTF_8)) }
            }
            val code = connection.responseCode
            val stream = if (code in 200..299) connection.inputStream else connection.errorStream
            val text = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
            val json = runCatching { JSONObject(text) }.getOrElse { JSONObject().put("error", "HTTP $code") }
            if (code !in 200..299 || json.optBoolean("ok", true).not()) {
                throw IllegalStateException(json.optString("error", "HTTP $code"))
            }
            return json
        } finally {
            connection.disconnect()
        }
    }

    private fun enc(value: String): String = URLEncoder.encode(value, Charsets.UTF_8.name())

    private fun JSONObject.optDoubleOrNull(key: String): Double? {
        if (!has(key) || isNull(key)) return null
        val value = optDouble(key, Double.NaN)
        return value.takeIf { it.isFinite() }
    }
}
