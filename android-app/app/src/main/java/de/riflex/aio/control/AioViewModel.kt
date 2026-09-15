package de.riflex.aio.control

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import de.riflex.aio.control.data.AioApiClient
import de.riflex.aio.control.data.SecureConfigStore
import de.riflex.aio.control.model.ConnectionConfig
import de.riflex.aio.control.model.EventItem
import de.riflex.aio.control.model.Overview
import de.riflex.aio.control.model.SettingsPayload
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class AioViewModel(
    private val store: SecureConfigStore,
    private val api: AioApiClient = AioApiClient()
) : ViewModel() {
    private val _config = MutableStateFlow(store.load())
    val config: StateFlow<ConnectionConfig?> = _config.asStateFlow()

    private val _overview = MutableStateFlow<Overview?>(null)
    val overview: StateFlow<Overview?> = _overview.asStateFlow()

    private val _events = MutableStateFlow<List<EventItem>>(emptyList())
    val events: StateFlow<List<EventItem>> = _events.asStateFlow()

    private val _settings = MutableStateFlow<SettingsPayload?>(null)
    val settings: StateFlow<SettingsPayload?> = _settings.asStateFlow()

    private val _busy = MutableStateFlow(false)
    val busy: StateFlow<Boolean> = _busy.asStateFlow()

    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message.asStateFlow()

    init {
        if (_config.value != null) refreshOverview()
    }

    fun saveConfig(baseUrl: String, account: String, readKey: String, adminKey: String) {
        val normalized = baseUrl.trim().trimEnd('/')
        if (!normalized.startsWith("https://")) {
            _message.value = "Die Worker-URL muss mit https:// beginnen."
            return
        }
        if (readKey.isBlank()) {
            _message.value = "READ_KEY fehlt."
            return
        }
        val next = ConnectionConfig(normalized, account.trim().ifBlank { "default" }, readKey.trim(), adminKey.trim())
        store.save(next)
        _config.value = next
        _overview.value = null
        _events.value = emptyList()
        _settings.value = null
        _message.value = "Verbindung gespeichert."
        refreshOverview()
    }

    fun clearConfig() {
        store.clear()
        _config.value = null
        _overview.value = null
        _events.value = emptyList()
        _settings.value = null
        _message.value = null
    }

    fun clearMessage() { _message.value = null }

    fun refreshOverview() = runRequest {
        _overview.value = api.overview(requireConfig())
    }

    fun ensureEvents() {
        if (_events.value.isEmpty()) refreshEvents()
    }

    fun refreshEvents() = runRequest {
        _events.value = api.events(requireConfig())
    }

    fun ensureSettings() {
        if (_settings.value == null) refreshSettings()
    }

    fun refreshSettings() = runRequest {
        _settings.value = api.settings(requireConfig())
    }

    fun patchSetting(key: String, value: Any) = runRequest {
        val current = _settings.value ?: api.settings(requireConfig()).also { _settings.value = it }
        _settings.value = api.patchSetting(requireConfig(), current.revision, key, value)
        _message.value = "Einstellung übernommen. Der Bot erhält sie beim nächsten Cloud-Sync."
    }

    private fun requireConfig(): ConnectionConfig = _config.value ?: error("Keine Verbindung konfiguriert")

    private fun runRequest(block: suspend () -> Unit) {
        if (_busy.value) return
        viewModelScope.launch {
            _busy.value = true
            try {
                block()
            } catch (error: Throwable) {
                _message.value = error.message ?: error::class.java.simpleName
            } finally {
                _busy.value = false
            }
        }
    }

    companion object {
        fun factory(context: Context): ViewModelProvider.Factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                return AioViewModel(SecureConfigStore(context.applicationContext)) as T
            }
        }
    }
}
