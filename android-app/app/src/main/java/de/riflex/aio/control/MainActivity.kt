package de.riflex.aio.control

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import de.riflex.aio.control.data.SecureConfigStore
import de.riflex.aio.control.host.AioHostService
import de.riflex.aio.control.ui.AioControlApp
import de.riflex.aio.control.ui.BotMapDialog

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        startHeadlessHostIfConfigured()
        setContent {
            val vm: AioViewModel = viewModel(factory = AioViewModel.factory(applicationContext))
            val overview by vm.overview.collectAsStateWithLifecycle()
            var showMap by remember { mutableStateOf(false) }
            Box(Modifier.fillMaxSize()) {
                AioControlApp(vm)
                Column(Modifier.align(Alignment.TopEnd).padding(top = 64.dp, end = 10.dp), verticalArrangement = Arrangement.spacedBy(6.dp), horizontalAlignment = Alignment.End) {
                    SmallFloatingActionButton(onClick = { startActivity(Intent(this@MainActivity, AdventureLandSessionActivity::class.java)) }) { Text("AL") }
                    SmallFloatingActionButton(onClick = { vm.refreshOverview(); showMap = true }) { Text("⌖") }
                }
            }
            if (showMap) BotMapDialog(overview?.characters.orEmpty()) { showMap = false }
        }
    }

    override fun onResume() { super.onResume(); startHeadlessHostIfConfigured() }

    private fun startHeadlessHostIfConfigured() {
        if (SecureConfigStore(applicationContext).load() == null) return
        ContextCompat.startForegroundService(applicationContext, Intent(applicationContext, AioHostService::class.java))
    }
}
