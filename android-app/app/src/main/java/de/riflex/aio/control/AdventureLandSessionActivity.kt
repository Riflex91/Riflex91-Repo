package de.riflex.aio.control

import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import de.riflex.aio.control.clientless.AdventureLandApi
import de.riflex.aio.control.clientless.NativeClientlessConfig
import de.riflex.aio.control.clientless.NativeClientlessConfigStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/** Native Adventure Land login. No WebView/browser session is created. */
@OptIn(ExperimentalMaterial3Api::class)
class AdventureLandSessionActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
        val store = NativeClientlessConfigStore(applicationContext)
        setContent {
            val scope = rememberCoroutineScope()
            var email by remember { mutableStateOf("") }
            var password by remember { mutableStateOf("") }
            var region by remember { mutableStateOf(store.load()?.region ?: "EU") }
            var identifier by remember { mutableStateOf(store.load()?.identifier ?: "I") }
            var busy by remember { mutableStateOf(false) }
            var status by remember { mutableStateOf(if (store.load() != null) "Native Adventure-Land-Sitzung gespeichert." else "Noch keine native Adventure-Land-Sitzung gespeichert.") }

            MaterialTheme {
                Scaffold(topBar = { TopAppBar(title = { Text("Adventure Land – Clientless Login") }) }) { padding ->
                    Column(
                        Modifier.padding(padding).padding(16.dp).fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text("Die Anmeldung erfolgt direkt über die Adventure-Land-API. Es wird kein WebView gestartet. Das Passwort wird nicht gespeichert; nur die Session wird verschlüsselt im Android Keystore abgelegt.")
                        OutlinedTextField(email, { email = it }, label = { Text("E-Mail") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                        OutlinedTextField(
                            password,
                            { password = it },
                            label = { Text("Passwort") },
                            singleLine = true,
                            visualTransformation = PasswordVisualTransformation(),
                            modifier = Modifier.fillMaxWidth()
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(region, { region = it.uppercase() }, label = { Text("Region") }, singleLine = true, modifier = Modifier.weight(1f))
                            OutlinedTextField(identifier, { identifier = it.uppercase() }, label = { Text("Server") }, singleLine = true, modifier = Modifier.weight(1f))
                        }
                        Button(
                            enabled = !busy && email.isNotBlank() && password.isNotBlank(),
                            onClick = {
                                busy = true
                                status = "Anmeldung läuft …"
                                scope.launch {
                                    val result = runCatching {
                                        withContext(Dispatchers.IO) { AdventureLandApi().login(email, password) }
                                    }
                                    password = ""
                                    result.onSuccess { session ->
                                        val previous = store.load()
                                        store.save(
                                            NativeClientlessConfig(
                                                userId = session.userId,
                                                userAuth = session.userAuth,
                                                secure = true,
                                                region = region.ifBlank { "EU" },
                                                identifier = identifier.ifBlank { "I" },
                                                characters = previous?.characters.orEmpty()
                                            )
                                        )
                                        status = "Native Sitzung gespeichert. Passwort wurde verworfen."
                                    }.onFailure { status = "Login fehlgeschlagen: ${it.message ?: it.javaClass.simpleName}" }
                                    busy = false
                                }
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) { Text(if (busy) "Anmelden …" else "Native Anmeldung") }
                        OutlinedButton(
                            enabled = !busy && store.load() != null,
                            onClick = { store.clear(); password = ""; status = "Native Sitzung gelöscht." },
                            modifier = Modifier.fillMaxWidth()
                        ) { Text("Gespeicherte Sitzung löschen") }
                        Text(status)
                    }
                }
            }
        }
    }
}
