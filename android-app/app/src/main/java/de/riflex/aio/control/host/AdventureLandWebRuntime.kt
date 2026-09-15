package de.riflex.aio.control.host

import android.annotation.SuppressLint
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import org.json.JSONObject
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference

/** Owns the isolated Adventure Land browser context used by the Android host. */
class AdventureLandWebRuntime(private val context: Context) : AutoCloseable {
    private val main = Handler(Looper.getMainLooper())
    private var webView: WebView? = null
    @Volatile private var loaded = false
    @Volatile private var lastError: String? = null

    @SuppressLint("SetJavaScriptEnabled")
    fun start() {
        main.post {
            if (webView != null) return@post
            webView = WebView(context).apply {
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.cacheMode = WebSettings.LOAD_DEFAULT
                settings.allowFileAccess = false
                settings.allowContentAccess = false
                webViewClient = object : WebViewClient() {
                    override fun onPageFinished(view: WebView?, url: String?) {
                        loaded = url?.startsWith(ALLOWED_ORIGIN) == true
                    }
                }
                loadUrl(ALLOWED_ORIGIN)
            }
        }
    }

    fun evaluateAllowed(operation: String, payload: JSONObject = JSONObject()): JSONObject {
        require(operation in ALLOWED_OPERATIONS) { "OPERATION_NOT_ALLOWED" }
        val request = JSONObject(payload.toString()).put("operation", operation)
        val script = dispatcherScript(request)
        val latch = CountDownLatch(1)
        val result = AtomicReference<JSONObject>()
        main.post {
            val view = webView
            if (view == null || !loaded || !view.url.orEmpty().startsWith(ALLOWED_ORIGIN)) {
                result.set(JSONObject().put("ok", false).put("error", "WEB_RUNTIME_NOT_READY")); latch.countDown(); return@post
            }
            view.evaluateJavascript(script) { raw ->
                result.set(parseEvaluation(raw)); latch.countDown()
            }
        }
        if (!latch.await(3, TimeUnit.SECONDS)) return JSONObject().put("ok", false).put("error", "WEB_RUNTIME_TIMEOUT")
        return result.get() ?: JSONObject().put("ok", false).put("error", "WEB_RUNTIME_EMPTY_RESULT")
    }

    fun status(): JSONObject = JSONObject()
        .put("created", webView != null)
        .put("loaded", loaded)
        .put("origin", ALLOWED_ORIGIN)
        .put("lastError", lastError)
        .put("arbitraryEvaluateExposed", false)

    private fun dispatcherScript(request: JSONObject): String {
        val encoded = JSONObject.quote(request.toString())
        return """(function(){try{var p=JSON.parse($encoded);var a=globalThis.AIO_V3;var o=a&&a.operations;if(!o)return JSON.stringify({ok:false,error:'AIO_V3_OPERATIONS_UNAVAILABLE'});var r;switch(p.operation){case 'HOST_HEARTBEAT':r=o.hostHeartbeat();break;case 'PENDING_ALERTS':r=o.pendingAlerts(Math.max(1,Math.min(100,p.limit||100)));break;case 'RECONCILIATION_STATUS':r=o.reconciliationStatus();break;case 'DEBUG_SNAPSHOT':r={schemaVersion:1,type:'AIO_V3_DEBUG_SNAPSHOT',status:Object.assign({},o.status(),{runtime:a.status?a.status():{},performance:a.performance&&a.performance.status?a.performance.status():null,farmer:a.farmer&&a.farmer.status?a.farmer.status():null,merchantService:a.merchantService&&a.merchantService.status?a.merchantService.status():null}),heartbeat:o.hostHeartbeat(),reconciliation:o.reconciliationStatus()};break;case 'DEBUG_EVENTS':var rows=o.peekTelemetry(2000)||[];var after=Math.max(0,p.afterSeq||0);r={schemaVersion:1,type:'AIO_V3_DEBUG_EVENTS',afterSeq:after,events:rows.filter(function(x){return x&&Number(x.seq)>after}).slice(0,Math.max(1,Math.min(200,p.limit||100)))};break;default:return JSON.stringify({ok:false,error:'HOST_OPERATION_NOT_ALLOWED'});}return JSON.stringify({ok:true,value:r});}catch(e){return JSON.stringify({ok:false,error:String(e&&e.message||e)});}})()"""
    }

    private fun parseEvaluation(raw: String?): JSONObject = runCatching {
        val decoded = if (raw != null && raw.startsWith("\"") && raw.endsWith("\"")) org.json.JSONTokener(raw).nextValue() as String else raw.orEmpty()
        JSONObject(decoded)
    }.getOrElse { error ->
        lastError = error.message
        JSONObject().put("ok", false).put("error", "WEB_RUNTIME_RESULT_INVALID")
    }

    override fun close() {
        main.post { webView?.destroy(); webView = null; loaded = false }
    }

    companion object {
        const val ALLOWED_ORIGIN = "https://adventure.land/"
        val ALLOWED_OPERATIONS = setOf("HOST_HEARTBEAT", "PENDING_ALERTS", "RECONCILIATION_STATUS", "DEBUG_SNAPSHOT", "DEBUG_EVENTS")
    }
}
