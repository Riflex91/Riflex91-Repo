package de.riflex.aio.control.clientless

import android.content.Context
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.io.File
import java.security.MessageDigest
import java.util.concurrent.TimeUnit

/**
 * Keeps the native engine on the newest repository-published bot logic manifest.
 *
 * The downloaded artifact is DATA, never arbitrary Android/JVM code. The native engine owns all
 * gameplay/network capabilities and interprets only the explicitly supported fields. A bad or
 * unreachable update therefore cannot replace the APK or gain Android execution privileges.
 */
class BotLogicUpdater(context: Context) {
    private val appContext = context.applicationContext
    private val dir = File(appContext.filesDir, "bot-logic").apply { mkdirs() }
    private val activeFile = File(dir, "active.json")
    private val previousFile = File(dir, "previous.json")
    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    data class Result(
        val changed: Boolean,
        val version: String?,
        val error: String? = null
    )

    fun active(): JSONObject? = runCatching {
        if (!activeFile.isFile) null else JSONObject(activeFile.readText())
    }.getOrNull()

    fun checkNow(): Result = runCatching {
        val manifest = getJson(MANIFEST_URL)
        val version = manifest.getString("version")
        val url = manifest.getString("url")
        val expectedSha256 = manifest.getString("sha256").lowercase()
        require(url.startsWith(ALLOWED_RAW_PREFIX)) { "logic URL outside repository" }

        val currentVersion = active()?.optString("version")
        if (currentVersion == version) return Result(false, version)

        val bytes = getBytes(url)
        val actualSha256 = sha256(bytes)
        require(actualSha256 == expectedSha256) { "logic sha256 mismatch" }

        val logic = JSONObject(bytes.toString(Charsets.UTF_8))
        require(logic.getString("version") == version) { "manifest/logic version mismatch" }
        validate(logic)

        val tmp = File(dir, "active.tmp")
        tmp.writeBytes(bytes)
        if (activeFile.exists()) activeFile.copyTo(previousFile, overwrite = true)
        check(tmp.renameTo(activeFile)) { "could not activate logic" }
        Result(true, version)
    }.getOrElse { Result(false, active()?.optString("version"), it.message ?: it.javaClass.simpleName) }

    fun rollback(): Boolean {
        if (!previousFile.isFile) return false
        return runCatching {
            val previous = JSONObject(previousFile.readText())
            validate(previous)
            previousFile.copyTo(activeFile, overwrite = true)
            true
        }.getOrDefault(false)
    }

    private fun validate(logic: JSONObject) {
        require(logic.optInt("schema", -1) == 1) { "unsupported logic schema" }
        require(logic.has("version")) { "logic version missing" }
        val defaults = logic.optJSONObject("defaults") ?: JSONObject()
        require(defaults.length() <= 32) { "too many default settings" }
        val roles = logic.optJSONObject("roles") ?: JSONObject()
        require(roles.length() <= 16) { "too many roles" }
    }

    private fun getJson(url: String) = JSONObject(getBytes(url).toString(Charsets.UTF_8))

    private fun getBytes(url: String): ByteArray {
        client.newCall(Request.Builder().url(url).header("Cache-Control", "no-cache").build()).execute().use { response ->
            check(response.isSuccessful) { "HTTP ${response.code}" }
            return response.body?.bytes() ?: error("empty response")
        }
    }

    private fun sha256(bytes: ByteArray): String = MessageDigest.getInstance("SHA-256")
        .digest(bytes).joinToString("") { "%02x".format(it) }

    companion object {
        private const val ALLOWED_RAW_PREFIX = "https://raw.githubusercontent.com/Riflex91/Adventure-Land---The-Code-MMORPG---Bot--public/"
        private const val MANIFEST_URL = "${ALLOWED_RAW_PREFIX}main/bot-runtime/latest.json"
    }
}
