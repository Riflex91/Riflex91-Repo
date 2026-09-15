package de.riflex.aio.control.clientless

import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit

/** Minimal Engine.IO v4 / Socket.IO v5 websocket transport for Adventure Land. */
class SocketIoWebSocket(
    private val client: OkHttpClient = OkHttpClient.Builder().pingInterval(20, TimeUnit.SECONDS).build()
) : AutoCloseable {
    private var socket: WebSocket? = null
    private val listeners = ConcurrentHashMap<String, MutableList<(Any?) -> Unit>>()
    @Volatile var connected = false; private set
    @Volatile var lastError: String? = null; private set

    fun on(event: String, listener: (Any?) -> Unit) { listeners.computeIfAbsent(event) { mutableListOf() }.add(listener) }

    fun connect(address: String, path: String, secure: Boolean) {
        val scheme = if (secure) "wss" else "ws"
        val cleanPath = if (path.startsWith('/')) path else "/$path"
        val url = "$scheme://$address$cleanPath?EIO=4&transport=websocket"
        socket = client.newWebSocket(Request.Builder().url(url).build(), object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) = Unit
            override fun onMessage(webSocket: WebSocket, text: String) { receive(text) }
            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                connected = false; lastError = t.message ?: t.javaClass.simpleName; fire("disconnect", lastError)
            }
            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) { connected = false; fire("disconnect", reason) }
        })
    }

    private fun receive(frame: String) {
        when {
            frame.startsWith("0") -> socket?.send("40") // Engine.IO open -> Socket.IO CONNECT /
            frame == "40" || frame.startsWith("40{") -> { connected = true; fire("connect", null) }
            frame == "2" -> socket?.send("3")
            frame.startsWith("42") -> {
                val packet = JSONArray(frame.substring(2)); if (packet.length() == 0) return
                fire(packet.getString(0), if (packet.length() > 1) packet.get(1) else null)
            }
            frame.startsWith("44") -> { lastError = frame.drop(2); fire("connect_error", lastError) }
        }
    }

    fun emit(event: String, payload: JSONObject = JSONObject()): Boolean =
        socket?.send("42" + JSONArray().put(event).put(payload).toString()) ?: false

    private fun fire(event: String, payload: Any?) { listeners[event]?.toList()?.forEach { it(payload) } }
    override fun close() { socket?.close(1000, "client closing"); socket = null; connected = false }
}
