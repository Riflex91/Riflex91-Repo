package de.riflex.aio.control.clientless

import android.content.Context
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.io.File
import java.security.MessageDigest
import java.util.concurrent.TimeUnit

/** Mirrors the real V3 updater contract: main/version.json -> botRawUrl -> newer semver. */
class BotLogicUpdater(context: Context) {
    private val dir = File(context.applicationContext.filesDir, "bot-logic").apply { mkdirs() }
    private val activeMeta = File(dir, "active.json")
    private val activeSourceFile = File(dir, "active-bot.js")
    private val previousMeta = File(dir, "previous.json")
    private val previousSource = File(dir, "previous-bot.js")
    private val client = OkHttpClient.Builder().connectTimeout(10, TimeUnit.SECONDS).readTimeout(20, TimeUnit.SECONDS).build()

    data class Result(val changed: Boolean, val version: String?, val error: String? = null)

    fun active(): JSONObject? = runCatching {
        if (!activeMeta.isFile || !activeSourceFile.isFile) null else JSONObject(activeMeta.readText())
    }.getOrNull()

    fun activeSource(): String? = runCatching { if (activeSourceFile.isFile) activeSourceFile.readText() else null }.getOrNull()

    fun checkNow(): Result = runCatching {
        val info = getJson(VERSION_URL)
        val remoteVersion = info.getString("version")
        val botUrl = info.getString("botRawUrl")
        require(botUrl.startsWith(ALLOWED_RAW_PREFIX) && botUrl.endsWith("/main/bot.js")) { "invalid V3 botRawUrl" }

        val currentVersion = active()?.optString("version")
        if (currentVersion != null && !newer(remoteVersion, currentVersion)) return Result(false, currentVersion)

        val bytes = getBytes(botUrl)
        val source = bytes.toString(Charsets.UTF_8)
        require(source.contains("var VERSION = '$remoteVersion'") || source.contains("var VERSION = \"$remoteVersion\"")) {
            "version.json/bot.js version mismatch"
        }
        require(source.contains("__ALBOT2__")) { "download is not AiO V3 bot.js" }

        val metadata = JSONObject()
            .put("version", remoteVersion)
            .put("build", info.optString("build"))
            .put("botRawUrl", botUrl)
            .put("sha256", sha256(bytes))
            .put("downloadedAt", System.currentTimeMillis())

        if (activeMeta.isFile) activeMeta.copyTo(previousMeta, overwrite = true)
        if (activeSourceFile.isFile) activeSourceFile.copyTo(previousSource, overwrite = true)
        val sourceTmp = File(dir, "active-bot.js.tmp").apply { writeBytes(bytes) }
        val metaTmp = File(dir, "active.json.tmp").apply { writeText(metadata.toString()) }
        check(sourceTmp.renameTo(activeSourceFile)) { "could not activate bot.js" }
        check(metaTmp.renameTo(activeMeta)) { "could not activate bot metadata" }
        Result(true, remoteVersion)
    }.getOrElse { Result(false, active()?.optString("version"), it.message ?: it.javaClass.simpleName) }

    fun rollback(): Boolean = runCatching {
        if (!previousMeta.isFile || !previousSource.isFile) return false
        previousMeta.copyTo(activeMeta, overwrite = true)
        previousSource.copyTo(activeSourceFile, overwrite = true)
        true
    }.getOrDefault(false)

    internal fun newer(candidate: String, current: String): Boolean {
        val a = semver(candidate); val b = semver(current)
        for (i in 0..2) if (a[i] != b[i]) return a[i] > b[i]
        return false
    }

    private fun semver(value: String): IntArray {
        val numbers = Regex("\\d+").findAll(value).map { it.value.toIntOrNull() ?: 0 }.take(3).toList()
        return IntArray(3) { numbers.getOrElse(it) { 0 } }
    }

    private fun getJson(url: String) = JSONObject(getBytes(url).toString(Charsets.UTF_8))
    private fun getBytes(url: String): ByteArray {
        client.newCall(Request.Builder().url(url).header("Cache-Control", "no-cache").build()).execute().use { response ->
            check(response.isSuccessful) { "HTTP ${response.code}" }
            return response.body?.bytes() ?: error("empty response")
        }
    }
    private fun sha256(bytes: ByteArray): String = MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it) }

    companion object {
        private const val ALLOWED_RAW_PREFIX = "https://raw.githubusercontent.com/Riflex91/Adventure-Land---The-Code-MMORPG---Bot--public/"
        private const val VERSION_URL = "${ALLOWED_RAW_PREFIX}main/version.json"
    }
}
