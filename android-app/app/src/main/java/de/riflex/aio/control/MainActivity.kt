package de.riflex.aio.control

import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.core.content.ContextCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import de.riflex.aio.control.data.SecureConfigStore
import de.riflex.aio.control.host.AioHostService
import de.riflex.aio.control.ui.AioControlApp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        startHeadlessHostIfConfigured()
        setContent {
            val vm: AioViewModel = viewModel(factory = AioViewModel.factory(applicationContext))
            AioControlApp(vm)
        }
    }

    override fun onResume() {
        super.onResume()
        // Configuration may have been saved while the activity stayed alive.
        startHeadlessHostIfConfigured()
    }

    private fun startHeadlessHostIfConfigured() {
        if (SecureConfigStore(applicationContext).load() == null) return
        val intent = Intent(applicationContext, AioHostService::class.java)
        ContextCompat.startForegroundService(applicationContext, intent)
    }
}
