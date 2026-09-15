package de.riflex.aio.control.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import de.riflex.aio.control.AioViewModel
import de.riflex.aio.control.model.CharacterStatus
import de.riflex.aio.control.model.EventItem
import de.riflex.aio.control.model.Overview
import de.riflex.aio.control.model.SettingItem
import java.text.DateFormat
import java.util.Date
import java.util.Locale

private val Bg = Color(0xFF050B10)
private val Panel = Color(0xFF0B1720)
private val Panel2 = Color(0xFF102430)
private val Mint = Color(0xFF62E6A7)
private val Yellow = Color(0xFFFFD166)
private val Red = Color(0xFFFF667C)
private val Cyan = Color(0xFF68E8E0)
private val Muted = Color(0xFF8AA4B5)

enum class AppTab(val label: String, val glyph: String) {
    OVERVIEW("Übersicht", "⌂"),
    CHARACTERS("Charaktere", "♟"),
    EVENTS("Events", "!"),
    CONTROL("Steuerung", "≡"),
    DATA("Daten", "#"),
    CONNECTION("Verbindung", "⚙")
}

@Composable
fun AioControlApp(vm: AioViewModel) {
    val config by vm.config.collectAsStateWithLifecycle()
    val overview by vm.overview.collectAsStateWithLifecycle()
    val events by vm.events.collectAsStateWithLifecycle()
    val settings by vm.settings.collectAsStateWithLifecycle()
    val busy by vm.busy.collectAsStateWithLifecycle()
    val message by vm.message.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    var tab by rememberSaveable { mutableStateOf(if (config == null) AppTab.CONNECTION else AppTab.OVERVIEW) }

    LaunchedEffect(message) {
        val text = message ?: return@LaunchedEffect
        snackbar.showSnackbar(text)
        vm.clearMessage()
    }
    LaunchedEffect(tab, config) {
        if (config == null) return@LaunchedEffect
        when (tab) {
            AppTab.EVENTS -> vm.ensureEvents()
            AppTab.CONTROL -> vm.ensureSettings()
            else -> Unit
        }
    }

    AioTheme {
        Scaffold(
            containerColor = Bg,
            snackbarHost = { SnackbarHost(snackbar) },
            topBar = {
                Surface(color = Panel) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text("AiO Bot Control", fontWeight = FontWeight.Black)
                            Text(
                                if (config == null) "Nicht verbunden" else "${config!!.account} · ${tab.label}",
                                color = Muted,
                                style = MaterialTheme.typography.labelSmall
                            )
                        }
                        if (config != null && tab in setOf(AppTab.OVERVIEW, AppTab.CHARACTERS, AppTab.DATA)) {
                            TextButton(enabled = !busy, onClick = vm::refreshOverview) { Text(if (busy) "…" else "Aktualisieren") }
                        } else if (config != null && tab == AppTab.EVENTS) {
                            TextButton(enabled = !busy, onClick = vm::refreshEvents) { Text(if (busy) "…" else "Aktualisieren") }
                        } else if (config != null && tab == AppTab.CONTROL) {
                            TextButton(enabled = !busy, onClick = vm::refreshSettings) { Text(if (busy) "…" else "Aktualisieren") }
                        }
                    }
                }
            },
            bottomBar = {
                if (config != null) {
                    NavigationBar(containerColor = Panel) {
                        AppTab.entries.forEach { item ->
                            NavigationBarItem(
                                selected = tab == item,
                                onClick = { tab = item },
                                icon = { Text(item.glyph) },
                                label = { Text(item.label, maxLines = 1) }
                            )
                        }
                    }
                }
            }
        ) { inner ->
            Box(Modifier.fillMaxSize().padding(inner)) {
                when {
                    config == null -> ConnectionScreen(null, vm)
                    tab == AppTab.OVERVIEW -> OverviewScreen(overview)
                    tab == AppTab.CHARACTERS -> CharacterScreen(overview)
                    tab == AppTab.EVENTS -> EventsScreen(events)
                    tab == AppTab.CONTROL -> ControlScreen(settings?.items.orEmpty(), config!!.canAdmin, vm)
                    tab == AppTab.DATA -> DataScreen(overview)
                    tab == AppTab.CONNECTION -> ConnectionScreen(config, vm)
                }
            }
        }
    }
}

@Composable
private fun OverviewScreen(overview: Overview?) {
    if (overview == null) return EmptyState("Noch keine Statusdaten geladen.")
    val live = overview.characters.count { it.connectionState == "live" }
    val delayed = overview.characters.count { it.connectionState == "delayed" }
    val offline = overview.characters.size - live - delayed
    val gold = overview.characters.sumOf { it.gold }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MetricCard("Live", live.toString(), Mint, Modifier.weight(1f))
                MetricCard("Verzögert", delayed.toString(), Yellow, Modifier.weight(1f))
                MetricCard("Offline", offline.toString(), Red, Modifier.weight(1f))
            }
        }
        item { MetricCard("Party-Gold", formatNumber(gold), Cyan, Modifier.fillMaxWidth()) }
        item {
            CapacityCard(
                title = "Cloud-Nutzung der App",
                value = "On-Demand",
                detail = "Kein Hintergrunddienst · kein Auto-Polling · kein R2-Zugriff"
            )
        }
        item {
            SectionCard("Letzter Abruf") {
                Text(formatTime(overview.fetchedAt), color = Color.White)
                Text("Neue Daten werden nur auf deinen Befehl geladen.", color = Muted)
            }
        }
    }
}

@Composable
private fun CharacterScreen(overview: Overview?) {
    val characters = overview?.characters.orEmpty()
    if (characters.isEmpty()) return EmptyState("Keine Charakterdaten vorhanden.")
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        items(characters, key = { it.name }) { character -> CharacterCard(character) }
    }
}

@Composable
private fun CharacterCard(c: CharacterStatus) {
    val stateColor = when (c.connectionState) {
        "live" -> Mint
        "delayed" -> Yellow
        else -> Red
    }
    Card(colors = CardDefaults.cardColors(containerColor = Panel), modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(c.name, fontWeight = FontWeight.Bold)
                    Text("${c.ctype} · Level ${c.level} · ${c.map}", color = Muted)
                }
                Text(c.connectionState.uppercase(), color = stateColor, fontWeight = FontWeight.Bold)
            }
            ResourceBar("HP", c.hp, c.maxHp)
            ResourceBar("MP", c.mp, c.maxMp)
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Gold", color = Muted)
                Text(formatNumber(c.gold), fontWeight = FontWeight.SemiBold)
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Runtime", color = Muted)
                Text(c.mode.ifBlank { "?" })
            }
            Text("Status vor ${if (c.ageSeconds == Long.MAX_VALUE) "?" else c.ageSeconds} s", color = Muted, style = MaterialTheme.typography.labelSmall)
        }
    }
}

@Composable
private fun ResourceBar(label: String, value: Long, max: Long) {
    val ratio = if (max > 0) value.toFloat() / max.toFloat() else 0f
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label, color = Muted)
            Text("$value / $max")
        }
        LinearProgressIndicator(progress = { ratio.coerceIn(0f, 1f) }, modifier = Modifier.fillMaxWidth())
    }
}

@Composable
private fun EventsScreen(events: List<EventItem>) {
    if (events.isEmpty()) return EmptyState("Keine Events geladen oder vorhanden.")
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(events, key = { "${it.character}:${it.eventAt}:${it.event}" }) { event ->
            val color = when (event.severity) {
                "error", "critical", "fatal" -> Red
                "warn", "warning" -> Yellow
                else -> Mint
            }
            Card(colors = CardDefaults.cardColors(containerColor = Panel), modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(event.severity.uppercase(), color = color, fontWeight = FontWeight.Black)
                        Spacer(Modifier.width(10.dp))
                        Text(event.character, color = Muted)
                        Spacer(Modifier.weight(1f))
                        Text(formatTime(event.eventAt), color = Muted, style = MaterialTheme.typography.labelSmall)
                    }
                    Text(event.event, fontWeight = FontWeight.Bold)
                    if (event.reason.isNotBlank()) Text(event.reason, color = Muted)
                    if (event.component.isNotBlank()) Text(event.component, color = Muted, style = MaterialTheme.typography.labelSmall)
                }
            }
        }
    }
}

@Composable
private fun ControlScreen(settings: List<SettingItem>, canAdmin: Boolean, vm: AioViewModel) {
    val editable = settings.filter { it.hot && !it.locked }
    if (settings.isEmpty()) return EmptyState("Einstellungen noch nicht geladen.")
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item {
            SectionCard("Remote-Steuerung") {
                Text(
                    if (canAdmin) "Änderungen werden über den vorhandenen revisionierten Settings-Kanal gespeichert."
                    else "Nur Lesen. Für Änderungen muss ein ADMIN_KEY in Verbindung hinterlegt sein.",
                    color = if (canAdmin) Mint else Yellow
                )
                Text("Kein separater Command-Queue-Write, kein R2.", color = Muted)
            }
        }
        editable.groupBy { it.category }.forEach { (category, rows) ->
            item { Text(category, color = Cyan, fontWeight = FontWeight.Black, modifier = Modifier.padding(top = 8.dp)) }
            items(rows, key = { it.key }) { setting -> SettingCard(setting, canAdmin, vm) }
        }
    }
}

@Composable
private fun SettingCard(setting: SettingItem, enabled: Boolean, vm: AioViewModel) {
    Card(colors = CardDefaults.cardColors(containerColor = Panel), modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(setting.label, fontWeight = FontWeight.Bold)
            Text(setting.description, color = Muted, style = MaterialTheme.typography.bodySmall)
            when (setting.type) {
                "boolean" -> {
                    val checked = setting.value as? Boolean ?: false
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Text(if (checked) "Aktiv" else "Aus", Modifier.weight(1f), color = if (checked) Mint else Muted)
                        Switch(checked = checked, enabled = enabled, onCheckedChange = { vm.patchSetting(setting.key, it) })
                    }
                }
                "select" -> SelectControl(setting, enabled, vm)
                "number" -> NumberControl(setting, enabled, vm)
                else -> Text(setting.value?.toString().orEmpty(), color = Muted)
            }
            Text(setting.key, color = Muted, style = MaterialTheme.typography.labelSmall)
        }
    }
}

@Composable
private fun SelectControl(setting: SettingItem, enabled: Boolean, vm: AioViewModel) {
    var expanded by remember { mutableStateOf(false) }
    Box {
        OutlinedButton(enabled = enabled, onClick = { expanded = true }) {
            Text(setting.value?.toString() ?: "Wählen")
        }
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            setting.values.forEach { value ->
                DropdownMenuItem(
                    text = { Text(value) },
                    onClick = {
                        expanded = false
                        vm.patchSetting(setting.key, value)
                    }
                )
            }
        }
    }
}

@Composable
private fun NumberControl(setting: SettingItem, enabled: Boolean, vm: AioViewModel) {
    val value = (setting.value as? Number)?.toDouble() ?: 0.0
    val step = setting.step ?: 1.0
    val min = setting.min ?: -Double.MAX_VALUE
    val max = setting.max ?: Double.MAX_VALUE
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        OutlinedButton(enabled = enabled && value > min, onClick = { vm.patchSetting(setting.key, normalizeNumber((value - step).coerceAtLeast(min), step)) }) { Text("−") }
        Text(formatSettingNumber(value), modifier = Modifier.weight(1f), fontWeight = FontWeight.Bold)
        OutlinedButton(enabled = enabled && value < max, onClick = { vm.patchSetting(setting.key, normalizeNumber((value + step).coerceAtMost(max), step)) }) { Text("+") }
    }
}

@Composable
private fun DataScreen(overview: Overview?) {
    if (overview == null) return EmptyState("Noch keine Daten geladen.")
    LazyColumn(Modifier.fillMaxSize().padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        item { MetricCard("Runtime-Statuszeilen", overview.database.runtimeStatuses.toString(), Cyan, Modifier.fillMaxWidth()) }
        item { MetricCard("Gespeicherte Events", overview.database.events.toString(), Yellow, Modifier.fillMaxWidth()) }
        item { MetricCard("Settings-Audits", overview.database.settingAudits.toString(), Mint, Modifier.fillMaxWidth()) }
        item {
            SectionCard("R2") {
                Text("Die Android-App liest oder schreibt kein R2.", color = Mint)
                Text("Archivierte Logs werden in dieser ersten Version bewusst nicht geladen.", color = Muted)
            }
        }
    }
}

@Composable
private fun ConnectionScreen(config: de.riflex.aio.control.model.ConnectionConfig?, vm: AioViewModel) {
    var baseUrl by remember(config) { mutableStateOf(config?.baseUrl.orEmpty()) }
    var account by remember(config) { mutableStateOf(config?.account ?: "default") }
    var readKey by remember(config) { mutableStateOf(config?.readKey.orEmpty()) }
    var adminKey by remember(config) { mutableStateOf(config?.adminKey.orEmpty()) }
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(18.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text("Verbindung", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
            Text("Die Zugangsdaten werden verschlüsselt im Android Keystore gespeichert.", color = Muted)
        }
        item { OutlinedTextField(baseUrl, { baseUrl = it }, label = { Text("Worker URL (https://…)") }, modifier = Modifier.fillMaxWidth(), singleLine = true) }
        item { OutlinedTextField(account, { account = it }, label = { Text("Account") }, modifier = Modifier.fillMaxWidth(), singleLine = true) }
        item {
            OutlinedTextField(
                readKey, { readKey = it }, label = { Text("READ_KEY") }, modifier = Modifier.fillMaxWidth(), singleLine = true,
                visualTransformation = PasswordVisualTransformation(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password)
            )
        }
        item {
            OutlinedTextField(
                adminKey, { adminKey = it }, label = { Text("ADMIN_KEY (optional)") }, modifier = Modifier.fillMaxWidth(), singleLine = true,
                visualTransformation = PasswordVisualTransformation(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password)
            )
        }
        item { Button(onClick = { vm.saveConfig(baseUrl, account, readKey, adminKey) }, modifier = Modifier.fillMaxWidth()) { Text("Speichern & verbinden") } }
        if (config != null) {
            item { OutlinedButton(onClick = vm::clearConfig, modifier = Modifier.fillMaxWidth()) { Text("Verbindung entfernen") } }
        }
        item {
            SectionCard("Ressourcenmodus") {
                Text("• Keine Hintergrund-Synchronisation", color = Mint)
                Text("• Kein automatisches Polling", color = Mint)
                Text("• Events/Settings nur beim Öffnen", color = Mint)
                Text("• Keine R2-Requests", color = Mint)
            }
        }
    }
}

@Composable
private fun MetricCard(label: String, value: String, accent: Color, modifier: Modifier = Modifier) {
    Card(modifier = modifier, colors = CardDefaults.cardColors(containerColor = Panel)) {
        Column(Modifier.padding(14.dp)) {
            Text(label, color = Muted, style = MaterialTheme.typography.labelMedium)
            Text(value, color = accent, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
        }
    }
}

@Composable
private fun CapacityCard(title: String, value: String, detail: String) {
    Card(colors = CardDefaults.cardColors(containerColor = Panel2), modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(title, color = Muted)
            Text(value, color = Mint, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
            Text(detail, color = Muted)
        }
    }
}

@Composable
private fun SectionCard(title: String, content: @Composable ColumnScope.() -> Unit) {
    Card(colors = CardDefaults.cardColors(containerColor = Panel), modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(15.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(title, fontWeight = FontWeight.Bold)
            content()
        }
    }
}

@Composable
private fun EmptyState(text: String) {
    Box(Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
        Text(text, color = Muted)
    }
}

@Composable
private fun AioTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = androidx.compose.material3.darkColorScheme(
            primary = Cyan,
            secondary = Mint,
            background = Bg,
            surface = Panel,
            error = Red
        ),
        content = content
    )
}

private fun normalizeNumber(value: Double, step: Double): Any {
    val integerLike = step % 1.0 == 0.0 && value % 1.0 == 0.0
    return if (integerLike) value.toLong() else ((value * 10000.0).toLong() / 10000.0)
}

private fun formatSettingNumber(value: Double): String = if (value % 1.0 == 0.0) value.toLong().toString() else "%.3f".format(Locale.US, value).trimEnd('0').trimEnd('.')
private fun formatNumber(value: Long): String = "%,d".format(Locale.GERMANY, value)
private fun formatTime(epoch: Long): String = if (epoch <= 0) "–" else DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.MEDIUM, Locale.GERMANY).format(Date(epoch))
