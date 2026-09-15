package de.riflex.aio.control.model

data class ConnectionConfig(
    val baseUrl: String,
    val account: String = "default",
    val readKey: String,
    val adminKey: String = ""
) {
    val canAdmin: Boolean get() = adminKey.isNotBlank()
}

data class CharacterStatus(
    val name: String,
    val ctype: String,
    val level: Int,
    val map: String,
    val hp: Long,
    val maxHp: Long,
    val mp: Long,
    val maxMp: Long,
    val gold: Long,
    val rip: Boolean,
    val mode: String,
    val connectionState: String,
    val ageSeconds: Long,
    val receivedAt: Long
)

data class DatabaseStats(
    val runtimeStatuses: Long = 0,
    val events: Long = 0,
    val settingAudits: Long = 0
)

data class Overview(
    val now: Long,
    val account: String,
    val characters: List<CharacterStatus>,
    val database: DatabaseStats,
    val settingsRevision: Long,
    val fetchedAt: Long = System.currentTimeMillis()
)

data class EventItem(
    val character: String,
    val severity: String,
    val component: String,
    val event: String,
    val reason: String,
    val eventAt: Long
)

data class SettingItem(
    val key: String,
    val category: String,
    val label: String,
    val description: String,
    val type: String,
    val locked: Boolean,
    val hot: Boolean,
    val min: Double?,
    val max: Double?,
    val step: Double?,
    val values: List<String>,
    val value: Any?
)

data class SettingsPayload(
    val revision: Long,
    val items: List<SettingItem>,
    val updatedAt: Long
)
