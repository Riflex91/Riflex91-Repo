package de.riflex.aio.control.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import de.riflex.aio.control.model.CharacterStatus
import kotlin.math.max

@Composable
fun BotMapDialog(characters: List<CharacterStatus>, onDismiss: () -> Unit) {
    val located = characters.filter { it.x != null && it.y != null }
    var scale by remember { mutableFloatStateOf(1f) }
    var pan by remember { mutableStateOf(Offset.Zero) }
    val mapName = located.groupingBy { it.map }.eachCount().maxByOrNull { it.value }?.key ?: "Keine Positionsdaten"
    val visible = located.filter { it.map == mapName }

    Dialog(onDismissRequest = onDismiss) {
        Surface(shape = MaterialTheme.shapes.large, tonalElevation = 8.dp) {
            Column(Modifier.fillMaxWidth().padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Column { Text("Bot-Karte", style = MaterialTheme.typography.titleLarge); Text(mapName, style = MaterialTheme.typography.labelMedium) }
                    TextButton(onClick = onDismiss) { Text("Schließen") }
                }
                Box(Modifier.fillMaxWidth().height(420.dp).background(Color(0xFF07131B)).pointerInput(Unit) {
                    detectTransformGestures { _, panChange, zoom, _ -> scale = (scale * zoom).coerceIn(0.5f, 8f); pan += panChange }
                }) {
                    Canvas(Modifier.fillMaxSize()) {
                        val cx = if (visible.isEmpty()) 0.0 else visible.mapNotNull { it.x }.average()
                        val cy = if (visible.isEmpty()) 0.0 else visible.mapNotNull { it.y }.average()
                        val spread = max(250.0, visible.flatMap { listOf(kotlin.math.abs((it.x ?: cx)-cx), kotlin.math.abs((it.y ?: cy)-cy)) }.maxOrNull() ?: 250.0)
                        val unit = (size.minDimension / (spread * 2.4)).toFloat() * scale
                        for (i in -5..5) { val d=i*100f*unit; drawLine(Color(0x2239E6C5), Offset(size.width/2+d+pan.x,0f), Offset(size.width/2+d+pan.x,size.height),1f); drawLine(Color(0x2239E6C5), Offset(0f,size.height/2+d+pan.y), Offset(size.width,size.height/2+d+pan.y),1f) }
                        visible.forEach { c ->
                            val px=size.width/2+(((c.x?:cx)-cx).toFloat()*unit)+pan.x; val py=size.height/2+(((c.y?:cy)-cy).toFloat()*unit)+pan.y
                            val color=when(c.connectionState){"live"->Color(0xFF62E6A7);"delayed"->Color(0xFFFFD166);else->Color(0xFFFF667C)}
                            drawCircle(color,12f,Offset(px,py)); drawCircle(color,20f,Offset(px,py),style=Stroke(2f)); drawContext.canvas.nativeCanvas.drawText(c.name,px+18f,py-14f,android.graphics.Paint().apply{this.color=android.graphics.Color.WHITE;textSize=28f})
                        }
                    }
                }
                Text(if (visible.isEmpty()) "Noch keine x/y-Koordinaten in der Telemetrie." else "${visible.size} Bots · Pinch-to-Zoom · Ziehen zum Verschieben", style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}
