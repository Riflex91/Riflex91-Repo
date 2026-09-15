package de.riflex.aio.control.clientless

import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class AdventureLandApi(private val origin: String = "https://adventure.land") {
    data class Bootstrap(val server: JSONObject, val character: JSONObject)

    fun serversAndCharacter(config: NativeClientlessConfig, characterName: String): Bootstrap {
        val body = post("/api/servers_and_characters", "{}", config)
        val info = body.getJSONArray("infs").getJSONObject(0)
        val servers = info.getJSONArray("servers")
        val characters = info.getJSONArray("characters")
        val server = (0 until servers.length()).map { servers.getJSONObject(it) }.firstOrNull {
            it.optString("region") == config.region && it.optString("name") == config.identifier
        } ?: error("Adventure Land server ${config.region}/${config.identifier} not found")
        val character = (0 until characters.length()).map { characters.getJSONObject(it) }.firstOrNull {
            it.optString("name") == characterName
        } ?: error("Character '$characterName' not found on account")
        return Bootstrap(server, character)
    }

    private fun post(path: String, json: String, config: NativeClientlessConfig): JSONObject {
        val connection = (URL(origin + path).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 15_000
            readTimeout = 20_000
            doOutput = true
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("Accept", "application/json")
            setRequestProperty("Cookie", "auth=${config.userId}-${config.userAuth}")
        }
        connection.outputStream.use { it.write(json.toByteArray(Charsets.UTF_8)) }
        val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
        val text = stream.bufferedReader().use { it.readText() }
        if (connection.responseCode !in 200..299) error("Adventure Land HTTP ${connection.responseCode}: $text")
        return JSONObject(text)
    }
}
