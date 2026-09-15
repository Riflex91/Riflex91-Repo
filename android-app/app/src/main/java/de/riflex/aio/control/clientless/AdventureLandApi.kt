package de.riflex.aio.control.clientless

import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class AdventureLandApi(private val origin: String = "https://adventure.land") {
    data class LoginSession(val userId: String, val userAuth: String)
    data class Bootstrap(val server: JSONObject, val character: JSONObject)

    fun login(email: String, password: String): LoginSession {
        require(email.isNotBlank()) { "E-Mail fehlt" }
        require(password.isNotBlank()) { "Passwort fehlt" }
        val payload = JSONObject()
            .put("email", email.trim())
            .put("only_login", true)
            .put("password", password)
        val body = postUnauthenticated("/api/signup_or_login", payload.toString())
        if (!body.optBoolean("success", false)) {
            error(body.optString("reason", "Adventure Land login failed"))
        }
        val userId = body.optString("user")
        val userAuth = body.optString("auth")
        check(userId.isNotBlank() && userAuth.isNotBlank()) { "Adventure Land login returned no session" }
        return LoginSession(userId, userAuth)
    }

    fun serversAndCharacter(config: NativeClientlessConfig, characterName: String): Bootstrap {
        val body = postAuthenticated("/api/servers_and_characters", "{}", config)
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

    private fun postUnauthenticated(path: String, json: String): JSONObject = request(path, json, null)

    private fun postAuthenticated(path: String, json: String, config: NativeClientlessConfig): JSONObject =
        request(path, json, "auth=${config.userId}-${config.userAuth}")

    private fun request(path: String, json: String, cookie: String?): JSONObject {
        val connection = (URL(origin + path).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 15_000
            readTimeout = 20_000
            doOutput = true
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("Accept", "application/json")
            if (cookie != null) setRequestProperty("Cookie", cookie)
        }
        connection.outputStream.use { it.write(json.toByteArray(Charsets.UTF_8)) }
        val code = connection.responseCode
        val stream = if (code in 200..299) connection.inputStream else connection.errorStream
        val text = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
        if (code !in 200..299) error("Adventure Land HTTP $code: $text")
        return JSONObject(text)
    }
}
