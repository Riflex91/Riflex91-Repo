namespace AioBotLinuxBridge;

public static class DashboardPage
{
    public static string Render(string csrfToken) => Html.Replace("__CSRF__", csrfToken, StringComparison.Ordinal);

    private const string Html = """
<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AIO Bot Linux Bridge</title>
<style>
:root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#0d1117;color:#e6edf3}
*{box-sizing:border-box}body{margin:0;background:#0d1117}.wrap{max-width:1180px;margin:auto;padding:24px}
h1{margin:0 0 6px;font-size:28px}h2{font-size:17px;margin:0 0 14px}.muted{color:#8b949e}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:16px;margin-top:18px}
.card{background:#161b22;border:1px solid #30363d;border-radius:12px;padding:18px;box-shadow:0 8px 24px #0004}
.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.status{display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px}
label{display:block;color:#8b949e;font-size:12px;margin:9px 0 4px}input,select{width:100%;padding:9px 10px;border-radius:7px;border:1px solid #30363d;background:#0d1117;color:#e6edf3}
input[type=checkbox]{width:auto}.inline{display:flex;gap:10px;align-items:center}
button{border:1px solid #30363d;background:#21262d;color:#e6edf3;padding:9px 12px;border-radius:7px;cursor:pointer}
button.primary{background:#238636;border-color:#2ea043}button.danger{background:#da3633;border-color:#f85149}
button:hover{filter:brightness(1.12)}pre{white-space:pre-wrap;word-break:break-word;background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:12px;max-height:360px;overflow:auto}
.good{color:#3fb950}.bad{color:#f85149}.warn{color:#d29922}.pill{padding:3px 7px;border:1px solid #30363d;border-radius:999px;font-size:12px}
#toast{position:fixed;right:18px;bottom:18px;max-width:520px;background:#161b22;border:1px solid #30363d;padding:12px 15px;border-radius:10px;display:none}
</style>
</head>
<body>
<div class="wrap">
  <h1>AIO Bot Linux Bridge</h1>
  <div class="muted">Linux-Port · lokale Steuerung nur über Loopback · keine Secrets im Status</div>
  <div class="row" style="margin-top:12px">
    <span class="pill" id="build">Build …</span>
    <span class="pill" id="secretService">Secret Service …</span>
    <button onclick="refresh()">Status aktualisieren</button>
  </div>

  <div class="grid">
    <section class="card">
      <h2>Übersicht</h2>
      <div class="status">
        <div>Telemetrie</div><div id="telemetryState">—</div>
        <div>Browser/CDP</div><div id="browserState">—</div>
        <div>Supabase</div><div id="supabaseState">—</div>
        <div>Wissenswächter</div><div id="knowledgeState">—</div>
        <div>GitHub</div><div id="githubState">—</div>
        <div>Backblaze</div><div id="backblazeState">—</div>
      </div>
      <label>Letzter Fehler</label>
      <pre id="lastError">—</pre>
    </section>

    <section class="card">
      <h2>Browser / CDP</h2>
      <label>Bevorzugter Browser</label>
      <select id="browserPref"><option>Brave</option><option>Chrome</option><option>Chromium</option><option>Edge</option></select>
      <div class="inline"><input type="checkbox" id="autoBrowser"><label for="autoBrowser">Browser automatisch starten</label></div>
      <div class="inline"><input type="checkbox" id="headless"><label for="headless">Headless-Modus</label></div>
      <div class="row" style="margin-top:10px">
        <button class="primary" onclick="saveSettings()">Speichern</button>
        <button onclick="act('/api/browser/ensure')">Starten / prüfen</button>
      </div>
      <label>CDP Endpoint</label><code id="cdpEndpoint">—</code>
    </section>

    <section class="card">
      <h2>Supabase-Telemetrie</h2>
      <div id="tokenPresent" class="muted">Token …</div>
      <label>Telemetrie-Token</label><input id="token" type="password" autocomplete="off">
      <div class="row" style="margin-top:10px">
        <button onclick="saveSecret('/api/token','token')">Token speichern</button>
        <button class="danger" onclick="act('/api/token/delete')">Token löschen</button>
        <button class="primary" onclick="toggleTelemetry(true)">Telemetrie AN</button>
        <button onclick="toggleTelemetry(false)">Telemetrie AUS</button>
      </div>
    </section>

    <section class="card">
      <h2>Webinterface / Cloudflare</h2>
      <div id="dashboardKeyPresent" class="muted">Write Key …</div>
      <label>Webinterface Write Key</label><input id="dashboardKey" type="password" autocomplete="off">
      <div class="row" style="margin-top:10px">
        <button onclick="saveSecret('/api/dashboard-key','dashboardKey')">Key speichern</button>
        <button class="danger" onclick="act('/api/dashboard-key/delete')">Key löschen</button>
      </div>
    </section>

    <section class="card">
      <h2>Backblaze</h2>
      <div id="backblazePresent" class="muted">Credentials …</div>
      <label>Key ID</label><input id="b2KeyId" type="password" autocomplete="off">
      <label>Application Key</label><input id="b2ApplicationKey" type="password" autocomplete="off">
      <div class="row" style="margin-top:10px">
        <button onclick="saveBackblaze()">Speichern</button>
        <button onclick="act('/api/backblaze/send')">Jetzt an Bot senden</button>
        <button onclick="act('/api/backblaze/self-test')">Live-Test</button>
        <button class="danger" onclick="act('/api/backblaze-credentials/delete')">Löschen</button>
      </div>
    </section>

    <section class="card">
      <h2>GitHub & Wissenswächter</h2>
      <label>Live-Wissensdatenbank</label><input id="livePath">
      <div class="row" style="margin-top:10px">
        <button class="primary" onclick="saveSettings()">Pfad speichern</button>
        <button onclick="toggleKnowledge(true)">Wissenswächter AN</button>
        <button onclick="toggleKnowledge(false)">Wissenswächter AUS</button>
        <button onclick="act('/api/knowledge/run')">Jetzt ausführen</button>
        <button onclick="act('/api/github/refresh')">GitHub neu prüfen</button>
      </div>
      <p class="muted">GitHub-PAT wird weiterhin nicht von der Bridge gelesen. Anmeldung einmalig über Git Credential Manager im Terminal durchführen.</p>
    </section>

    <section class="card">
      <h2>V5 Readiness</h2>
      <button class="primary" onclick="readiness()">Readiness-Test starten</button>
      <pre id="readiness">Noch nicht ausgeführt.</pre>
    </section>

    <section class="card">
      <h2>Details</h2>
      <pre id="details">Lade …</pre>
    </section>
  </div>
</div>
<div id="toast"></div>
<script>
const csrf="__CSRF__";
let state=null;
async function api(path, method="GET", body){
  const opts={method,headers:{}};
  if(method!=="GET") opts.headers["X-AIO-Bridge-CSRF"]=csrf;
  if(body!==undefined){opts.headers["Content-Type"]="application/json";opts.body=JSON.stringify(body);}
  const r=await fetch(path,opts);
  const data=await r.json();
  if(!r.ok || data.ok===false) throw new Error(data.error||("HTTP "+r.status));
  return data.result===undefined?data:data.result;
}
function text(id,v){document.getElementById(id).textContent=v??"—"}
function cls(id,ok){const e=document.getElementById(id);e.className=ok===true?"good":ok===false?"bad":"warn"}
function toast(msg,bad=false){const e=document.getElementById("toast");e.textContent=msg;e.style.display="block";e.style.borderColor=bad?"#f85149":"#3fb950";setTimeout(()=>e.style.display="none",5000)}
async function refresh(){
  try{
    state=await api("/api/status");
    const c=state.config,t=state.telemetry,k=state.wissenswaechter,g=state.gitHub;
    text("build","Build "+state.buildNumber);
    text("secretService",state.secretServiceAvailable?"Secret Service verfügbar":"Secret Service fehlt · ENV-Fallback");
    text("telemetryState",c.telemetryEnabled?(t?.state||"STARTET"):"AUS");cls("telemetryState",c.telemetryEnabled?(t?.state==="CONNECTED"||t?.state==="IDLE"?true:null):null);
    text("browserState",t?.browserReady?"VERBUNDEN":(t?.state||"—"));cls("browserState",t?.browserReady??null);
    text("supabaseState",t?.supabaseReady?"VERBUNDEN":"—");cls("supabaseState",t?.supabaseReady??null);
    text("knowledgeState",c.wissenswaechterAktiv?(k?.zustand||"WARTET"):"AUS");
    text("githubState",g.angemeldet?(g.konto||"ANGEMELDET"):"NICHT ANGEMELDET");cls("githubState",g.angemeldet);
    text("backblazeState",t?.backblazeState||(state.backblazeCredentialsPresent?"CREDENTIALS BEREIT":"KEINE CREDENTIALS"));
    text("lastError",state.lastActionError||t?.lastError||k?.fehler||"—");
    text("tokenPresent",state.telemetryTokenPresent?"Token vorhanden":"Kein Token");
    text("dashboardKeyPresent",state.webDashboardWriteKeyPresent?"Write Key vorhanden":"Kein Write Key");
    text("backblazePresent",state.backblazeCredentialsPresent?"Credentials vorhanden":"Keine Credentials");
    document.getElementById("browserPref").value=c.preferredBrowser;
    document.getElementById("autoBrowser").checked=c.autoStartBrowser;
    document.getElementById("headless").checked=c.browserHeadless;
    document.getElementById("livePath").value=c.liveWissensdatenbankPfad;
    text("cdpEndpoint",c.cdpEndpoint);
    text("details",JSON.stringify({telemetry:t,wissenswaechter:k,gitHub:g,config:{dashboardListenUrl:c.dashboardListenUrl,allowedOrigin:c.allowedOrigin,backblazeBucket:c.backblazeBucket,backblazeRegion:c.backblazeRegion}},null,2));
  }catch(e){toast(e.message,true)}
}
async function act(path,body){
  try{const r=await api(path,"POST",body);toast("Erfolgreich");text("details",JSON.stringify(r,null,2));await refresh();return r}catch(e){toast(e.message,true);throw e}
}
async function saveSecret(path,id){const e=document.getElementById(id);await act(path,{value:e.value});e.value=""}
async function saveBackblaze(){const a=document.getElementById("b2KeyId"),b=document.getElementById("b2ApplicationKey");await act("/api/backblaze-credentials",{keyId:a.value,applicationKey:b.value});a.value="";b.value=""}
async function toggleTelemetry(enabled){await act("/api/telemetry",{enabled})}
async function toggleKnowledge(enabled){await act("/api/knowledge",{enabled})}
async function saveSettings(){
  await act("/api/settings",{
    autoStartBrowser:document.getElementById("autoBrowser").checked,
    browserHeadless:document.getElementById("headless").checked,
    preferredBrowser:document.getElementById("browserPref").value,
    liveKnowledgePath:document.getElementById("livePath").value
  });
}
async function readiness(){try{const r=await act("/api/readiness");text("readiness",JSON.stringify(r,null,2))}catch{}}
refresh();setInterval(refresh,5000);
</script>
</body>
</html>
""";
}
