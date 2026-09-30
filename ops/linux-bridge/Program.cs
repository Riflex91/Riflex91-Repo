using System.Text.Json;
using AioBotWindowsBridge;

if (args.Contains("--self-test", StringComparer.Ordinal))
{
    await LinuxBridgeSelfTest.RunAsync();
    return;
}

if (args.Contains("--print-admin-token", StringComparer.Ordinal))
{
    Console.WriteLine(LinuxAdminTokenStore.LoadOrCreate());
    return;
}

var config = await BridgeConfig.LoadAsync();
var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://127.0.0.1:18741");
builder.Services.AddSingleton(config);
builder.Services.AddSingleton<LinuxBridgeRuntime>();
builder.Services.AddSingleton<Microsoft.Extensions.Hosting.IHostedService>(
    sp => sp.GetRequiredService<LinuxBridgeRuntime>());
var app = builder.Build();

app.Use(async (ctx, next) =>
{
    ctx.Response.Headers.CacheControl = "no-store";
    ctx.Response.Headers["X-Content-Type-Options"] = "nosniff";
    ctx.Response.Headers["Referrer-Policy"] = "no-referrer";
    ctx.Response.Headers["Content-Security-Policy"] =
        "default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'";
    await next();
});

app.MapGet("/", () =>
    Results.Content(
        BuildPage(GitHubAnmeldung.TokenVorlageUrl),
        "text/html; charset=utf-8"));

app.MapGet("/health", (LinuxBridgeRuntime runtime) =>
{
    var state = runtime.Snapshot().Watchdog.State;
    var healthy = state is "HEALTHY" or "STARTING" or "RECOVERING" or "DISABLED";
    return Results.Json(new { ok = healthy, state }, statusCode: healthy ? 200 : 503);
});

app.MapGet("/api/status", (HttpContext ctx, LinuxBridgeRuntime runtime) =>
{
    RequireAdmin(ctx, runtime);
    return Results.Json(runtime.Snapshot());
});

app.MapPost("/api/actions/browser-restart", async (
    HttpContext ctx,
    LinuxBridgeRuntime runtime,
    CancellationToken ct) =>
{
    RequireAdmin(ctx, runtime);
    return Results.Json(await runtime.RestartBrowserAsync(ct));
});

app.MapPost("/api/actions/knowledge-run", async (
    HttpContext ctx,
    LinuxBridgeRuntime runtime,
    CancellationToken ct) =>
{
    RequireAdmin(ctx, runtime);
    await runtime.RunKnowledgeNowAsync(ct);
    return Results.Ok(new { ok = true });
});

app.MapPost("/api/actions/backblaze-test", async (
    HttpContext ctx,
    LinuxBridgeRuntime runtime,
    CancellationToken ct) =>
{
    RequireAdmin(ctx, runtime);
    return Results.Json(await runtime.TestBackblazeAsync(ct));
});

app.MapPost("/api/actions/readiness", async (
    HttpContext ctx,
    LinuxBridgeRuntime runtime,
    CancellationToken ct) =>
{
    RequireAdmin(ctx, runtime);
    return Results.Json(await runtime.RunReadinessAsync(ct));
});

app.MapPost("/api/actions/storage-probe", async (
    HttpContext ctx,
    LinuxBridgeRuntime runtime,
    CancellationToken ct) =>
{
    RequireAdmin(ctx, runtime);
    return Results.Json(await runtime.ProbeStorageAsync(ct));
});

app.MapPost("/api/github/status", async (
    HttpContext ctx,
    LinuxBridgeRuntime runtime,
    CancellationToken ct) =>
{
    RequireAdmin(ctx, runtime);
    return Results.Json(await runtime.GetGitHubStatusAsync(ct));
});

app.MapPost("/api/github/login", async (
    HttpContext ctx,
    LinuxBridgeRuntime runtime,
    CancellationToken ct) =>
{
    RequireAdmin(ctx, runtime);
    return Results.Json(await runtime.LoginGitHubAsync(ct));
});

app.MapPost("/api/github/logout", async (
    HttpContext ctx,
    LinuxBridgeRuntime runtime,
    CancellationToken ct) =>
{
    RequireAdmin(ctx, runtime);
    return Results.Json(await runtime.LogoutGitHubAsync(ct));
});

app.MapPost("/api/config/{name}", async (
    string name,
    HttpContext ctx,
    LinuxBridgeRuntime runtime,
    CancellationToken ct) =>
{
    RequireAdmin(ctx, runtime);

    if (name == "live-path")
    {
        var body = await JsonSerializer.DeserializeAsync<ValueRequest>(
            ctx.Request.Body,
            cancellationToken: ct) ?? throw new BadHttpRequestException("invalid json");
        return Results.Json(new
        {
            ok = true,
            path = await runtime.SetLiveKnowledgePathAsync(body.Value, ct)
        });
    }

    var toggle = await JsonSerializer.DeserializeAsync<ToggleRequest>(
        ctx.Request.Body,
        cancellationToken: ct) ?? throw new BadHttpRequestException("invalid json");

    switch (name)
    {
        case "telemetry":
            await runtime.SetTelemetryEnabledAsync(toggle.Enabled, ct);
            break;
        case "dashboard":
            await runtime.SetDashboardEnabledAsync(toggle.Enabled, ct);
            break;
        case "backblaze":
            await runtime.SetBackblazeEnabledAsync(toggle.Enabled, ct);
            break;
        case "knowledge":
            await runtime.SetKnowledgeEnabledAsync(toggle.Enabled, ct);
            break;
        default:
            throw new BadHttpRequestException("invalid config name", 404);
    }

    return Results.Ok(new { ok = true });
});

app.MapPost("/api/signal", async (
    HttpContext ctx,
    LinuxBridgeRuntime runtime,
    CancellationToken ct) =>
{
    RequireAdmin(ctx, runtime);
    var body = await JsonSerializer.DeserializeAsync<ToggleRequest>(
        ctx.Request.Body,
        cancellationToken: ct) ?? throw new BadHttpRequestException("invalid json");
    return Results.Json(await runtime.SetSignalAsync(body.Enabled, ct));
});

app.MapPost("/api/secrets/telemetry", async (
    HttpContext ctx,
    LinuxBridgeRuntime runtime,
    CancellationToken ct) =>
{
    RequireAdmin(ctx, runtime);
    var body = await JsonSerializer.DeserializeAsync<ValueRequest>(
        ctx.Request.Body,
        cancellationToken: ct) ?? throw new BadHttpRequestException("invalid json");
    await runtime.SaveTelemetryTokenAsync(body.Value, ct);
    return Results.Ok(new { ok = true });
});

app.MapPost("/api/secrets/dashboard", async (
    HttpContext ctx,
    LinuxBridgeRuntime runtime,
    CancellationToken ct) =>
{
    RequireAdmin(ctx, runtime);
    var body = await JsonSerializer.DeserializeAsync<ValueRequest>(
        ctx.Request.Body,
        cancellationToken: ct) ?? throw new BadHttpRequestException("invalid json");
    await runtime.SaveDashboardKeyAsync(body.Value, ct);
    return Results.Ok(new { ok = true });
});

app.MapPost("/api/secrets/backblaze", async (
    HttpContext ctx,
    LinuxBridgeRuntime runtime,
    CancellationToken ct) =>
{
    RequireAdmin(ctx, runtime);
    var body = await JsonSerializer.DeserializeAsync<BackblazeRequest>(
        ctx.Request.Body,
        cancellationToken: ct) ?? throw new BadHttpRequestException("invalid json");
    await runtime.SaveBackblazeAsync(body.KeyId, body.ApplicationKey, ct);
    return Results.Ok(new { ok = true });
});

app.MapDelete("/api/secrets/{name}", async (
    string name,
    HttpContext ctx,
    LinuxBridgeRuntime runtime,
    CancellationToken ct) =>
{
    RequireAdmin(ctx, runtime);
    await runtime.DeleteSecretAsync(name, ct);
    return Results.Ok(new { ok = true });
});

await app.RunAsync();

static void RequireAdmin(HttpContext ctx, LinuxBridgeRuntime runtime)
{
    if (!ctx.Request.Headers.TryGetValue("X-Aio-Admin-Token", out var token)
        || !System.Security.Cryptography.CryptographicOperations.FixedTimeEquals(
            System.Text.Encoding.UTF8.GetBytes(token.ToString()),
            System.Text.Encoding.UTF8.GetBytes(runtime.AdminToken)))
    {
        throw new BadHttpRequestException("admin token required", 403);
    }
}

static string BuildPage(string tokenTemplateUrl) => """
<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AIO Bot Linux Bridge</title><style>
body{font-family:system-ui,sans-serif;background:#0d1117;color:#e6edf3;margin:0}main{max-width:1180px;margin:auto;padding:24px}h1{margin-bottom:4px}.muted{color:#8b949e}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;margin:20px 0}.card{background:#161b22;border:1px solid #30363d;border-radius:12px;padding:16px}button,input,a.btn{background:#21262d;color:#e6edf3;border:1px solid #30363d;border-radius:7px;padding:9px;margin:4px 2px;text-decoration:none;display:inline-block}input{width:min(92%,460px)}pre{white-space:pre-wrap;word-break:break-word;background:#010409;padding:12px;border-radius:8px;max-height:430px;overflow:auto}.ok{color:#3fb950}.warn{color:#d29922}
</style></head><body><main><h1>AIO Bot Linux Bridge</h1><div class="muted">V6 Transport · 24/7 Watchdog · systemd · Secret Service</div>

<div class="card"><h3>Lokale Administration</h3><p class="muted">Der Admin-Token wird nicht über HTTP ausgeliefert. Lokal anzeigen mit <code>AioBotLinuxBridge --print-admin-token</code>.</p><input id="adminToken" type="password" placeholder="Admin-Token"><button onclick="authenticate()">Entsperren</button><button onclick="lockUi()">Sperren</button><span id="authState" class="muted">GESPERRT</span></div>

<div class="grid">
<div class="card"><h3>Watchdog & Browser</h3><div id="watchdog">lädt…</div><button onclick="act('/api/actions/browser-restart')">Browser neu starten</button></div>
<div class="card"><h3>Telemetrie</h3><div id="telemetry">lädt…</div><button onclick="toggleCfg('telemetry',true)">Telemetrie AN</button><button onclick="toggleCfg('telemetry',false)">AUS</button><br><button onclick="signal(true)">ChatGPT-Signale AN</button><button onclick="signal(false)">AUS</button></div>
<div class="card"><h3>Cloudflare Dashboard</h3><div id="dashboard">lädt…</div><button onclick="toggleCfg('dashboard',true)">Dashboard AN</button><button onclick="toggleCfg('dashboard',false)">AUS</button></div>
<div class="card"><h3>Backblaze B2 V6</h3><div id="backblaze">lädt…</div><button onclick="toggleCfg('backblaze',true)">Archiv AN</button><button onclick="toggleCfg('backblaze',false)">AUS</button><button onclick="act('/api/actions/backblaze-test')">V6 Verbindung testen</button></div>
<div class="card"><h3>GitHub & Wissenswächter</h3><div id="github">lädt…</div><a class="btn" href="__TOKEN_URL__" target="_blank" rel="noreferrer">Fine-grained PAT erstellen</a><button onclick="githubAct('login')">Token anmelden</button><button onclick="githubAct('logout')">Abmelden</button><button onclick="githubAct('status')">Status</button><br><button onclick="toggleCfg('knowledge',true)">Wissenswächter AN</button><button onclick="toggleCfg('knowledge',false)">AUS</button><button onclick="act('/api/actions/knowledge-run')">Jetzt aktualisieren</button></div>
<div class="card"><h3>Live-Wissensdatenbank</h3><div id="knowledge">lädt…</div><input id="livePath" placeholder="/mnt/adventureland/wissensdatenbank"><button onclick="savePath()">Pfad speichern</button><button onclick="detail('/api/actions/storage-probe','Datenträgerprüfung')">Datenträger prüfen</button></div>
</div>

<div class="card"><h3>Sichere Zugangsdaten</h3><p class="muted">Linux Secret Service/libsecret; keine Secrets in settings.json.</p>
<input id="telemetryToken" type="password" placeholder="ALBOT V6 Telemetry Token"><button onclick="saveValue('telemetry','telemetryToken')">Telemetry speichern</button><button onclick="delSecret('telemetry')">löschen</button><br>
<input id="dashboardKey" type="password" placeholder="Cloudflare Write Key"><button onclick="saveValue('dashboard','dashboardKey')">Dashboard speichern</button><button onclick="delSecret('dashboard')">löschen</button><br>
<input id="b2id" type="password" placeholder="Backblaze Key ID"><input id="b2key" type="password" placeholder="Backblaze Application Key"><button onclick="saveB2()">Backblaze speichern & aktivieren</button><button onclick="delSecret('backblaze')">löschen</button>
</div>

<div class="grid">
<div class="card"><h3>Readiness</h3><button onclick="detail('/api/actions/readiness','Linux Readiness')">Readiness-Test</button><pre id="detail">Noch nicht ausgeführt.</pre></div>
<div class="card"><h3>Technischer Status</h3><pre id="raw">lädt…</pre></div>
</div>

<script>
let T=sessionStorage.getItem('aioAdminToken')||'';
async function req(url,opt={}){if(!T)throw new Error('Admin-Token erforderlich');opt.headers={...(opt.headers||{}),'X-Aio-Admin-Token':T,'Content-Type':'application/json'};let r=await fetch(url,opt);if(!r.ok)throw new Error(await r.text());return r.headers.get('content-type')?.includes('json')?r.json():r.text()}
async function authenticate(){const candidate=adminToken.value.trim();if(!candidate){alert('Admin-Token eingeben');return}const previous=T;T=candidate;try{await refresh();sessionStorage.setItem('aioAdminToken',T);adminToken.value='';authState.textContent='ENTSPERRT'}catch(e){T=previous;alert(e.message)}}
function lockUi(){T='';sessionStorage.removeItem('aioAdminToken');authState.textContent='GESPERRT';raw.textContent='Admin-Token erforderlich.'}
async function refresh(){if(!T){authState.textContent='GESPERRT';raw.textContent='Admin-Token erforderlich.';return}let s=await req('/api/status');authState.textContent='ENTSPERRT';raw.textContent=JSON.stringify(s,null,2);watchdog.textContent=s.watchdog.state+' · Browser '+s.watchdog.browser+' · Bot '+s.watchdog.bot;telemetry.textContent=(s.telemetry?.state||'nicht aktiv')+' · '+(s.telemetryEnabled?'AN':'AUS')+' · Token '+(s.telemetryTokenConfigured?'OK':'FEHLT');dashboard.textContent=(s.webDashboardEnabled?'AN':'AUS')+' · Key '+(s.dashboardKeyConfigured?'OK':'FEHLT');backblaze.textContent=(s.backblazeEnabled?'AN':'AUS')+' · Zugangsdaten '+(s.backblazeCredentialsConfigured?'OK':'FEHLEN');github.textContent=s.github?.angemeldet?('ANGEMELDET · '+(s.github.konto||'')):(s.github?.verfuegbar?'NICHT ANGEMELDET':'GCM NICHT VERFÜGBAR');knowledge.textContent=(s.knowledgeEnabled?'AN':'AUS')+' · '+(s.knowledge?.zustand||'wartet');if(document.activeElement!==livePath)livePath.value=s.liveKnowledgePath||''}
async function act(url){try{let x=await req(url,{method:'POST',body:'{}'});detail.textContent=JSON.stringify(x,null,2);await refresh()}catch(e){alert(e.message)}}
async function detail(url,title){try{let x=await req(url,{method:'POST',body:'{}'});document.getElementById('detail').textContent=title+'\n'+JSON.stringify(x,null,2);await refresh()}catch(e){alert(e.message)}}
async function signal(enabled){try{await req('/api/signal',{method:'POST',body:JSON.stringify({enabled})});await refresh()}catch(e){alert(e.message)}}
async function toggleCfg(name,enabled){try{await req('/api/config/'+name,{method:'POST',body:JSON.stringify({enabled})});await refresh()}catch(e){alert(e.message)}}
async function githubAct(action){try{let x=await req('/api/github/'+action,{method:'POST',body:'{}'});detail.textContent='GitHub '+action+'\n'+JSON.stringify(x,null,2);await refresh()}catch(e){alert(e.message)}}
async function savePath(){try{let x=await req('/api/config/live-path',{method:'POST',body:JSON.stringify({value:livePath.value})});detail.textContent=JSON.stringify(x,null,2);await refresh()}catch(e){alert(e.message)}}
async function saveValue(name,id){try{await req('/api/secrets/'+name,{method:'POST',body:JSON.stringify({value:document.getElementById(id).value})});document.getElementById(id).value='';await refresh()}catch(e){alert(e.message)}}
async function saveB2(){try{await req('/api/secrets/backblaze',{method:'POST',body:JSON.stringify({keyId:b2id.value,applicationKey:b2key.value})});b2id.value='';b2key.value='';await refresh()}catch(e){alert(e.message)}}
async function delSecret(name){try{await req('/api/secrets/'+name,{method:'DELETE'});await refresh()}catch(e){alert(e.message)}}
refresh();setInterval(refresh,5000);
</script></main></body></html>
"""
.Replace("__TOKEN_URL__", tokenTemplateUrl, StringComparison.Ordinal);

public sealed record ValueRequest(string Value);
public sealed record BackblazeRequest(string KeyId, string ApplicationKey);
public sealed record ToggleRequest(bool Enabled);
