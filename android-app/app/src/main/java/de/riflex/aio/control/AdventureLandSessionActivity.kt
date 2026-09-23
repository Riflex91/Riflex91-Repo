package de.riflex.aio.control

import android.annotation.SuppressLint
import android.graphics.Color
import android.os.Bundle
import android.text.InputType
import android.view.WindowManager
import android.webkit.CookieManager
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.ComponentActivity
import org.json.JSONObject

/** Visible, first-party Adventure Land browser used to establish/refresh the persistent WebView session. */
class AdventureLandSessionActivity : ComponentActivity() {
    private var webView: WebView? = null
    private lateinit var email: EditText
    private lateinit var password: EditText
    private lateinit var status: TextView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
        WebView.setWebContentsDebuggingEnabled(false)
        CookieManager.getInstance().setAcceptCookie(true)

        email = EditText(this).apply {
            hint = "Adventure Land E-Mail"
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
            setSingleLine(true)
        }
        password = EditText(this).apply {
            hint = "Passwort"
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
            setSingleLine(true)
        }
        status = TextView(this).apply { setTextColor(Color.LTGRAY); text = "Login-Daten bleiben lokal und werden nur in die Adventure-Land-Seite eingesetzt." }
        val login = Button(this).apply {
            text = "Bei Adventure Land anmelden"
            setOnClickListener { submitLogin() }
        }
        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            settings.allowFileAccess = false
            settings.allowContentAccess = false
            CookieManager.getInstance().setAcceptThirdPartyCookies(this, false)
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean = !isAllowed(url)
                override fun onPageFinished(view: WebView?, url: String?) {
                    if (isAllowed(url)) CookieManager.getInstance().flush()
                }
            }
            loadUrl(ALLOWED_ORIGIN)
        }
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(16, 16, 16, 16)
            addView(email, LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT)
            addView(password, LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT)
            addView(login, LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT)
            addView(status, LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT)
            addView(webView, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f))
        }
        setContentView(root)
    }

    private fun isAllowed(url: String?): Boolean = url?.startsWith(ALLOWED_ORIGIN) == true

    private fun submitLogin() {
        val mail = email.text.toString().trim()
        val secret = password.text.toString()
        if (mail.isBlank() || secret.isBlank()) { status.text = "E-Mail und Passwort eingeben."; return }
        val view = webView ?: return
        if (!isAllowed(view.url)) { status.text = "Login ist nur auf adventure.land erlaubt."; return }
        val mailJs = JSONObject.quote(mail)
        val passJs = JSONObject.quote(secret)
        val script = """
            (function(){
              if(location.origin!=='https://adventure.land') return 'wrong_origin';
              var e=document.getElementById('email'), p=document.getElementById('password'), b=document.querySelector('.slbutton');
              if(!e||!p||!b) return (typeof inside!=='undefined'&&inside!=='login')?'already_logged_in':'login_form_not_ready';
              e.value=$mailJs; p.value=$passJs;
              e.dispatchEvent(new Event('input',{bubbles:true})); p.dispatchEvent(new Event('input',{bubbles:true}));
              b.click(); return 'submitted';
            })();
        """.trimIndent()
        view.evaluateJavascript(script) { result ->
            password.setText("")
            status.text = when (result?.trim('"')) {
                "submitted" -> "Anmeldung gesendet. Passwort wurde aus dem App-Feld gelöscht."
                "already_logged_in" -> "Adventure-Land-Sitzung ist bereits angemeldet."
                "login_form_not_ready" -> "Login-Seite ist noch nicht bereit. Kurz warten und erneut versuchen."
                else -> "Anmeldung konnte auf dieser Seite nicht gestartet werden."
            }
        }
    }

    override fun onPause() { CookieManager.getInstance().flush(); super.onPause() }
    override fun onDestroy() { password.setText(""); webView?.destroy(); webView = null; super.onDestroy() }

    companion object { const val ALLOWED_ORIGIN = "https://adventure.land/" }
}
