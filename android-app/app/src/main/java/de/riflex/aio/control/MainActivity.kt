package de.riflex.aio.control

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.viewmodel.compose.viewModel
import de.riflex.aio.control.ui.AioControlApp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val vm: AioViewModel = viewModel(factory = AioViewModel.factory(applicationContext))
            AioControlApp(vm)
        }
    }
}
