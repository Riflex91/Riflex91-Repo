package de.riflex.aio.control.clientless

import org.json.JSONArray
import org.json.JSONObject

class NativeCharacterSession(
    private val config: NativeClientlessConfig,
    val selection: NativeCharacterSelection,
    private val api: AdventureLandApi = AdventureLandApi()
) : AutoCloseable {
    private val socket = SocketIoWebSocket()
    @Volatile private var character = JSONObject().put("name", selection.name)
    @Volatile private var entities = JSONArray()
    @Volatile private var startedAt = 0L
    @Volatile private var ready = false

    fun start() {
        val bootstrap = api.serversAndCharacter(config, selection.name)
        val server = bootstrap.server
        val characterId = bootstrap.character.get("id")
        socket.on("welcome") {
            socket.emit("loaded", JSONObject().put("height", 1080).put("scale", 2).put("success", 1).put("width", 1920))
            socket.emit("auth", JSONObject()
                .put("auth", config.userAuth).put("character", characterId).put("height", 1080)
                .put("no_graphics", "True").put("no_html", "1").put("passphrase", "")
                .put("scale", 2).put("user", config.userId).put("width", 1920))
        }
        socket.on("start") { data ->
            if (data is JSONObject) {
                character = JSONObject(data.toString())
                entities = data.optJSONArray("entities") ?: JSONArray()
                ready = true; startedAt = System.currentTimeMillis()
            }
        }
        socket.on("player") { data -> if (data is JSONObject) mergeCharacter(data) }
        socket.on("entities") { data -> if (data is JSONArray) entities = JSONArray(data.toString()) }
        socket.on("disconnect") { ready = false }
        socket.connect(server.getString("address"), server.optString("path", "/socket.io"), config.secure)
    }

    @Synchronized private fun mergeCharacter(update: JSONObject) {
        val merged = JSONObject(character.toString()); update.keys().forEach { key -> merged.put(key, update.get(key)) }; character = merged
    }

    fun command(action: String, args: JSONObject): Boolean = when (action) {
        "move" -> socket.emit("move", JSONObject().put("x", args.getDouble("x")).put("y", args.getDouble("y")))
        "attack" -> socket.emit("attack", JSONObject().put("id", args.get("id")))
        "use_skill" -> socket.emit("skill", JSONObject().put("name", args.getString("name")).apply { if (args.has("id")) put("id", args.get("id")) })
        "stop" -> socket.emit("stop", JSONObject().put("action", "move"))
        else -> false
    }

    fun snapshot(): JSONObject = JSONObject()
        .put("name", selection.name).put("role", selection.role).put("ready", ready)
        .put("startedAt", startedAt).put("character", JSONObject(character.toString()))
        .put("entities", JSONArray(entities.toString())).put("socketConnected", socket.connected)
        .put("lastError", socket.lastError)

    override fun close() { ready = false; socket.close() }
}
