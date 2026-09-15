package de.riflex.aio.control.clientless

import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.ConcurrentHashMap

/** One Android process supervising multiple logical Adventure Land character sessions. */
class NativeClientlessManager(private val config: NativeClientlessConfig) : AutoCloseable {
    private val sessions = ConcurrentHashMap<String, NativeCharacterSession>()

    fun start() {
        config.characters.forEach { selection ->
            if (sessions.containsKey(selection.name)) return@forEach
            val session = NativeCharacterSession(config, selection)
            sessions[selection.name] = session
            session.start()
        }
    }

    fun command(character: String, action: String, args: JSONObject = JSONObject()): Boolean =
        sessions[character]?.command(action, args) ?: false

    fun status(): JSONObject {
        val rows = JSONArray(); sessions.values.sortedBy { it.selection.name }.forEach { rows.put(it.snapshot()) }
        return JSONObject().put("ok", true).put("runtime", "android-native-clientless")
            .put("browser", false).put("sessionCount", sessions.size).put("sessions", rows)
    }

    override fun close() { sessions.values.forEach { runCatching { it.close() } }; sessions.clear() }
}
