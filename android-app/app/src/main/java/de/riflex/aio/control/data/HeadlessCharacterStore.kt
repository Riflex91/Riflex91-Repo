package de.riflex.aio.control.data

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

enum class HeadlessRole { FARMER, MERCHANT }

data class HeadlessCharacterSelection(
    val name: String,
    val enabled: Boolean = true,
    val role: HeadlessRole = HeadlessRole.FARMER
)

class HeadlessCharacterStore(context: Context) {
    private val prefs = context.getSharedPreferences("aio_headless_characters", Context.MODE_PRIVATE)

    fun load(): List<HeadlessCharacterSelection> {
        val raw = prefs.getString(KEY, null) ?: return emptyList()
        return runCatching {
            val array = JSONArray(raw)
            buildList {
                for (i in 0 until array.length()) {
                    val item = array.getJSONObject(i)
                    val name = item.optString("name").trim()
                    if (name.isNotBlank()) add(
                        HeadlessCharacterSelection(
                            name = name,
                            enabled = item.optBoolean("enabled", true),
                            role = runCatching { HeadlessRole.valueOf(item.optString("role", "FARMER")) }.getOrDefault(HeadlessRole.FARMER)
                        )
                    )
                }
            }.distinctBy { it.name }
        }.getOrDefault(emptyList())
    }

    fun save(items: List<HeadlessCharacterSelection>) {
        val array = JSONArray()
        items.take(4).forEach { item ->
            array.put(JSONObject().put("name", item.name.trim()).put("enabled", item.enabled).put("role", item.role.name))
        }
        prefs.edit().putString(KEY, array.toString()).apply()
    }

    private companion object { const val KEY = "selected_characters_v1" }
}
