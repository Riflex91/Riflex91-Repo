package de.riflex.aio.control

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import de.riflex.aio.control.data.HeadlessCharacterSelection
import de.riflex.aio.control.data.HeadlessCharacterStore
import de.riflex.aio.control.data.HeadlessRole

@OptIn(ExperimentalMaterial3Api::class)
class HeadlessCharacterActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val store = HeadlessCharacterStore(applicationContext)
        setContent {
            var rows by remember { mutableStateOf(store.load().ifEmpty { List(4) { HeadlessCharacterSelection("") } }) }
            MaterialTheme {
                Scaffold(topBar = { TopAppBar(title = { Text("Headless-Charaktere") }) }) { padding ->
                    Column(Modifier.padding(padding).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("Wähle bis zu 4 Charaktere und ihre Aufgabe. Nur aktivierte Charaktere werden vom Headless-Host berücksichtigt.")
                        rows.forEachIndexed { index, item ->
                            Card(Modifier.fillMaxWidth()) {
                                Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    OutlinedTextField(value = item.name, onValueChange = { value -> rows = rows.toMutableList().also { it[index] = item.copy(name = value) } }, label = { Text("Charakter ${index + 1}") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Row { Switch(checked = item.enabled, onCheckedChange = { enabled -> rows = rows.toMutableList().also { it[index] = item.copy(enabled = enabled) } }); Text(" Aktiv") }
                                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                            FilterChip(selected = item.role == HeadlessRole.FARMER, onClick = { rows = rows.toMutableList().also { it[index] = item.copy(role = HeadlessRole.FARMER) } }, label = { Text("Farmer") })
                                            FilterChip(selected = item.role == HeadlessRole.MERCHANT, onClick = { rows = rows.toMutableList().also { it[index] = item.copy(role = HeadlessRole.MERCHANT) } }, label = { Text("Merchant") })
                                        }
                                    }
                                }
                            }
                        }
                        Button(onClick = { store.save(rows.filter { it.name.isNotBlank() }); finish() }, modifier = Modifier.fillMaxWidth()) { Text("Auswahl speichern") }
                    }
                }
            }
        }
    }
}
