package de.riflex.aio.control.clientless

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

data class NativeCharacterSelection(val name: String, val role: String = "farmer")
data class NativeClientlessConfig(
    val userId: String,
    val userAuth: String,
    val secure: Boolean = true,
    val region: String = "EU",
    val identifier: String = "I",
    val characters: List<NativeCharacterSelection>
)

/** Separate private store for Adventure Land auth material used by the native runtime. */
class NativeClientlessConfigStore(context: Context) {
    private val prefs = context.getSharedPreferences("aio_native_clientless", Context.MODE_PRIVATE)

    fun save(config: NativeClientlessConfig) {
        val chars = JSONArray()
        config.characters.forEach { chars.put(JSONObject().put("name", it.name).put("role", it.role)) }
        prefs.edit().putString("config", JSONObject()
            .put("userId", config.userId)
            .put("userAuth", config.userAuth)
            .put("secure", config.secure)
            .put("region", config.region)
            .put("identifier", config.identifier)
            .put("characters", chars).toString()).apply()
    }

    fun load(): NativeClientlessConfig? = prefs.getString("config", null)?.let { raw ->
        runCatching {
            val json = JSONObject(raw)
            val chars = json.optJSONArray("characters") ?: JSONArray()
            NativeClientlessConfig(
                userId = json.getString("userId"),
                userAuth = json.getString("userAuth"),
                secure = json.optBoolean("secure", true),
                region = json.optString("region", "EU"),
                identifier = json.optString("identifier", "I"),
                characters = (0 until chars.length()).map { i ->
                    val c = chars.getJSONObject(i)
                    NativeCharacterSelection(c.getString("name"), c.optString("role", "farmer"))
                }
            )
        }.getOrNull()
    }

    fun clear() = prefs.edit().clear().apply()
}
