package de.riflex.aio.control.clientless

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import org.json.JSONArray
import org.json.JSONObject
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

data class NativeCharacterSelection(val name: String, val role: String = "farmer")
data class NativeClientlessConfig(
    val userId: String,
    val userAuth: String,
    val secure: Boolean = true,
    val region: String = "EU",
    val identifier: String = "I",
    val characters: List<NativeCharacterSelection>
)

/** AndroidKeyStore-backed storage for Adventure Land session material used by the native runtime. */
class NativeClientlessConfigStore(context: Context) {
    private val prefs = context.getSharedPreferences("aio_native_clientless", Context.MODE_PRIVATE)

    fun save(config: NativeClientlessConfig) {
        val chars = JSONArray()
        config.characters.forEach { chars.put(JSONObject().put("name", it.name).put("role", it.role)) }
        val json = JSONObject()
            .put("userId", config.userId)
            .put("userAuth", config.userAuth)
            .put("secure", config.secure)
            .put("region", config.region)
            .put("identifier", config.identifier)
            .put("characters", chars)
            .toString()
        prefs.edit().putString(PREF_CONFIG, encrypt(json)).apply()
    }

    fun load(): NativeClientlessConfig? {
        val encrypted = prefs.getString(PREF_CONFIG, null) ?: return null
        return runCatching {
            val json = JSONObject(decrypt(encrypted))
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

    fun clear() = prefs.edit().remove(PREF_CONFIG).apply()

    private fun key(): SecretKey {
        val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (store.getKey(KEY_ALIAS, null) as? SecretKey)?.let { return it }
        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
        generator.init(
            KeyGenParameterSpec.Builder(KEY_ALIAS, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build()
        )
        return generator.generateKey()
    }

    private fun encrypt(plain: String): String {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, key())
        return Base64.encodeToString(cipher.iv, Base64.NO_WRAP) + "." +
            Base64.encodeToString(cipher.doFinal(plain.toByteArray(Charsets.UTF_8)), Base64.NO_WRAP)
    }

    private fun decrypt(value: String): String {
        val parts = value.split('.', limit = 2)
        require(parts.size == 2) { "invalid encrypted native config" }
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(
            Cipher.DECRYPT_MODE,
            key(),
            GCMParameterSpec(128, Base64.decode(parts[0], Base64.NO_WRAP))
        )
        return cipher.doFinal(Base64.decode(parts[1], Base64.NO_WRAP)).toString(Charsets.UTF_8)
    }

    private companion object {
        const val KEY_ALIAS = "aio_adventure_land_native_session_v1"
        const val PREF_CONFIG = "config_encrypted"
    }
}
