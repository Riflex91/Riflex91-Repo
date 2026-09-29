using System.Text.Json;
using AioBotWindowsBridge;

if (args.Contains("--self-test", StringComparer.Ordinal))
{
    await LinuxBridgeSelfTest.RunAsync();
    return;
}

var config = await BridgeConfig.LoadAsync();
var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://127.0.0.1:18741");
builder.Services.AddSingleton(config);
builder.Services.AddSingleton<LinuxBridgeRuntime>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<LinuxBridgeRuntime>());
var app = builder.Build();

app.Use(async (ctx, next) =>
{
    ctx.Response.Headers.CacheControl = "no-store";
    ctx.Response.Headers["X-Content-Type-Options"] = "nosniff";
    ctx.Response.Headers["Referrer-Policy"] = "no-referrer";
    ctx.Response.Headers["Content-Security-Policy"] = "default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'";
    await next();
});

app.MapGet("/", (LinuxBridgeRuntime runtime) => Results.Content(BuildPage(runtime.AdminToken), "text/html; charset=utf-8"));
app.MapGet("/health", (LinuxBridgeRuntime runtime) =>
{
    var snapshot = runtime.Snapshot();
    var healthy = snapshot.Watchdog.State is "HEALTHY" or "STARTING" or "RECOVERING";
    return Results.Json(new { ok = healthy, snapshot }, statusCode: healthy ? 200 : 503);
});
app.MapGet("/api/status", (LinuxBridgeRuntime runtime) => Results.Json(runtime.Snapshot()));

app.MapPost("/api/actions/browser-restart", async (HttpContext ctx, LinuxBridgeRuntime runtime, CancellationToken ct) =>
{
    RequireAdmin(ctx, runtime);
    return Results.Json(await runtime.RestartBrowserAsync(ct));
});
app.MapPost("/api/actions/knowledge-run", async (HttpContext ctx, LinuxBridgeRuntime runtime, CancellationToken ct) =>
{
    RequireAdmin(ctx, runtime);
    await runtime.RunKnowledgeNowAsync(ct);
    return Results.Ok(new { ok = true });
});
app.MapPost("/api/signal", async (HttpContext ctx, LinuxBridgeRuntime runtime, CancellationToken ct) =>
{
    RequireAdmin(ctx, runtime);
    var body = await JsonSerializer.DeserializeAsync<SignalRequest>(ctx.Request.Body, cancellationToken: ct) ?? throw new BadHttpRequestException("invalid json");
    return Results.Json(await runtime.SetSignalAsync(body.Enabled, ct));
});
app.MapPost("/api/secrets/telemetry", async (HttpContext ctx, LinuxBridgeRuntime runtime, CancellationToken ct) =>
{
    RequireAdmin(ctx, runtime);
    var body = await JsonSerializer.DeserializeAsync<ValueRequest>(ctx.Request.Body, cancellationToken: ct) ?? throw new BadHttpRequestException("invalid json");
    await runtime.SaveTelemetryTokenAsync(body.Value, ct);
    return Results.Ok(new { ok = true });
});
app.MapPost("/api/secrets/dashboard", async (HttpContext ctx, LinuxBridgeRuntime runtime, CancellationToken ct) =>
{
    RequireAdmin(ctx, runtime);
    var body = await JsonSerializer.DeserializeAsync<ValueRequest>(ctx.Request.Body, cancellationToken: ct) ?? throw new BadHttpRequestException("invalid json");
    await runtime.SaveDashboardKeyAsync(body.Value, ct);
    return Results.Ok(new { ok = true });
});
app.MapPost("/api/secrets/backblaze", async (HttpContext ctx, LinuxBridgeRuntime runtime, CancellationToken ct) =>
{
    RequireAdmin(ctx, runtime);
    var body = await JsonSerializer.DeserializeAsync<BackblazeRequest>(ctx.Request.Body, cancellationToken: ct) ?? throw new BadHttpRequestException("invalid json");
    await runtime.SaveBackblazeAsync(body.KeyId, body.ApplicationKey, ct);
    return Results.Ok(new { ok = true });
});
app.MapDelete("/api/secrets/{name}", async (string name, HttpContext ctx, LinuxBridgeRuntime runtime, CancellationToken ct) =>
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
            System.Text.Encoding.UTF8.GetBytes(token.ToString()), System.Text.Encoding.UTF8.GetBytes(runtime.AdminToken)))
        throw new BadHttpRequestException("admin token required", 403);
}

static string BuildPage(string adminToken) => $$"""
<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AIO Bot Linux Bridge</title><style>
body{font-family:system-ui,sans-serif;background:#0d1117;color:#e6edf3;margin:0}main{max-width:1180px;margin:auto;padding:24px}h1{margin-bottom:4px}.muted{color:#8b949e}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin:20px 0}.card{background:#161b22;border:1px solid #30363d;border-radius:12px;padding:16px}button,input{background:#21262d;color:#e6edf3;border:1px solid #30363d;border-radius:7px;padding:9px;margin:4px 2px}input{width:min(92%,460px)}pre{white-space:pre-wrap;word-break:break-word;background:#010409;padding:12px;border-radius:8px;max-height:430px;overflow:auto}
</style></head><body><main><h1>AIO Bot Linux Bridge</h1><div class="muted">V6 Transport · 24/7 Watchdog · systemd · Secret Service</div>
<div class="grid"><div class="card"><h3>Watchdog</h3><div id="watchdog">lädt…</div><button onclick="act('/api/actions/browser-restart')">Browser neu starten</button></div>
<div class="card"><h3>Telemetrie</h3><div id="telemetry">lädt…</div><button onclick="signal(true)">ChatGPT-Signale AN</button><button onclick="signal(false)">AUS</button></div>
<div class="card"><h3>Wissenswächter</h3><div id="knowledge">lädt…</div><button onclick="act('/api/actions/knowledge-run')">Jetzt aktualisieren</button></div></div>
<div class="card"><h3>Sichere Zugangsdaten</h3><p class="muted">Linux Secret Service/libsecret; keine Secrets in settings.json.</p>
<input id="telemetryToken" type="password" placeholder="ALBOT V6 Telemetry Token"><button onclick="saveValue('telemetry','telemetryToken')">Telemetry speichern</button><br>
<input id="dashboardKey" type="password" placeholder="Cloudflare Write Key"><button onclick="saveValue('dashboard','dashboardKey')">Dashboard speichern</button><br>
<input id="b2id" type="password" placeholder="Backblaze Key ID"><input id="b2key" type="password" placeholder="Backblaze Application Key"><button onclick="saveB2()">Backblaze speichern</button></div>
<div class="card"><h3>Technischer Status</h3><pre id="raw">lädt…</pre></div>
<script>
const T='{{adminToken}}';
async function req(url,opt={}){opt.headers={...(opt.headers||{}),'X-Aio-Admin-Token':T,'Content-Type':'application/json'};let r=await fetch(url,opt);if(!r.ok)throw new Error(await r.text());return r.headers.get('content-type')?.includes('json')?r.json():r.text()}
async function refresh(){let s=await fetch('/api/status').then(r=>r.json());raw.textContent=JSON.stringify(s,null,2);watchdog.textContent=s.watchdog.state+' · Browser '+s.watchdog.browser+' · Bot '+s.watchdog.bot;telemetry.textContent=(s.telemetry?.state||'nicht aktiv')+' · Token '+(s.telemetryTokenConfigured?'OK':'FEHLT');knowledge.textContent=s.knowledge?.zustand||'wartet'}
async function act(url){try{await req(url,{method:'POST',body:'{}'});await refresh()}catch(e){alert(e.message)}}
async function signal(enabled){try{await req('/api/signal',{method:'POST',body:JSON.stringify({enabled})});await refresh()}catch(e){alert(e.message)}}
async function saveValue(name,id){try{await req('/api/secrets/'+name,{method:'POST',body:JSON.stringify({value:document.getElementById(id).value})});document.getElementById(id).value='';await refresh()}catch(e){alert(e.message)}}
async function saveB2(){try{await req('/api/secrets/backblaze',{method:'POST',body:JSON.stringify({keyId:b2id.value,applicationKey:b2key.value})});b2id.value='';b2key.value='';await refresh()}catch(e){alert(e.message)}}
refresh();setInterval(refresh,5000);
</script></main></body></html>
""";

public sealed record ValueRequest(string Value);
public sealed record BackblazeRequest(string KeyId, string ApplicationKey);
public sealed record SignalRequest(bool Enabled);
