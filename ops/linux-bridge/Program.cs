using System.Security.Cryptography;
using System.Text;

namespace AioBotLinuxBridge;

public static class Program
{
    public static async Task<int> Main(string[] args)
    {
        if (LinuxBridgeUpdateBootstrap.IsApplyUpdateMode(args))
            return await LinuxBridgeUpdateBootstrap.ApplyAsync(args);

        if (!OperatingSystem.IsLinux())
        {
            Console.Error.WriteLine("AioBotLinuxBridge kann nur unter Linux ausgefuehrt werden.");
            return 2;
        }

        if (args.Contains("--self-test", StringComparer.Ordinal))
            return await RunSelfTestAsync();

        var config = await BridgeConfig.LoadAsync();

        var builder = WebApplication.CreateBuilder(args);
        builder.WebHost.UseUrls(config.DashboardListenUrl);
        builder.Services.AddSingleton(config);
        builder.Services.AddSingleton<BridgeRuntime>();

        var app = builder.Build();
        var runtime = app.Services.GetRequiredService<BridgeRuntime>();
        await runtime.InitializeAsync(app.Lifetime.ApplicationStopping);

        app.MapGet("/", () => Results.Content(DashboardPage.Render(runtime.CsrfToken), "text/html; charset=utf-8"));
        app.MapGet("/healthz", () => Results.Json(new
        {
            ok = true,
            platform = "linux",
            buildNumber = LinuxBridgeSelfUpdater.CurrentBuildNumber()
        }));
        app.MapGet("/api/status", () => Results.Json(runtime.Snapshot()));

        app.MapPost("/api/github/refresh", (HttpRequest request, CancellationToken ct) =>
            MutateAsync(request, runtime, () => runtime.RefreshGitHubAsync(ct)));

        app.MapPost("/api/token", (HttpRequest request, SecretValueRequest body, CancellationToken ct) =>
            MutateAsync(request, runtime, () => runtime.SaveTelemetryTokenAsync(body.Value ?? string.Empty, ct)));
        app.MapPost("/api/token/delete", (HttpRequest request, CancellationToken ct) =>
            MutateAsync(request, runtime, () => runtime.DeleteTelemetryTokenAsync(ct)));

        app.MapPost("/api/dashboard-key", (HttpRequest request, SecretValueRequest body, CancellationToken ct) =>
            MutateAsync(request, runtime, () => runtime.SaveDashboardWriteKeyAsync(body.Value ?? string.Empty, ct)));
        app.MapPost("/api/dashboard-key/delete", (HttpRequest request, CancellationToken ct) =>
            MutateAsync(request, runtime, () => runtime.DeleteDashboardWriteKeyAsync(ct)));

        app.MapPost("/api/backblaze-credentials", (HttpRequest request, BackblazeCredentialsRequest body, CancellationToken ct) =>
            MutateAsync(request, runtime, () => runtime.SaveBackblazeCredentialsAsync(
                body.KeyId ?? string.Empty,
                body.ApplicationKey ?? string.Empty,
                ct)));
        app.MapPost("/api/backblaze-credentials/delete", (HttpRequest request, CancellationToken ct) =>
            MutateAsync(request, runtime, () => runtime.DeleteBackblazeCredentialsAsync(ct)));

        app.MapPost("/api/telemetry", (HttpRequest request, ToggleRequest body, CancellationToken ct) =>
            MutateAsync(request, runtime, () => runtime.SetTelemetryEnabledAsync(body.Enabled, ct)));
        app.MapPost("/api/knowledge", (HttpRequest request, ToggleRequest body, CancellationToken ct) =>
            MutateAsync(request, runtime, () => runtime.SetWissenswaechterEnabledAsync(body.Enabled, ct)));
        app.MapPost("/api/settings", (HttpRequest request, BridgeSettingsUpdate body, CancellationToken ct) =>
            MutateAsync(request, runtime, () => runtime.UpdateSettingsAsync(body, ct)));

        app.MapPost("/api/browser/ensure", (HttpRequest request, CancellationToken ct) =>
            MutateAsync(request, runtime, () => runtime.EnsureBrowserAsync(ct)));
        app.MapPost("/api/backblaze/send", (HttpRequest request, CancellationToken ct) =>
            MutateAsync(request, runtime, () => runtime.SendBackblazeToBotAsync(ct)));
        app.MapPost("/api/backblaze/self-test", (HttpRequest request, CancellationToken ct) =>
            MutateAsync(request, runtime, () => runtime.BackblazeSelfTestAsync(ct)));
        app.MapPost("/api/knowledge/run", (HttpRequest request, CancellationToken ct) =>
            MutateAsync(request, runtime, () => runtime.RunWissenswaechterNowAsync(ct)));
        app.MapPost("/api/readiness", (HttpRequest request, CancellationToken ct) =>
            MutateAsync(request, runtime, () => runtime.RunReadinessAsync(ct)));

        try
        {
            await app.RunAsync();
            return 0;
        }
        finally
        {
            await runtime.DisposeAsync();
        }
    }

    private static async Task<IResult> MutateAsync<T>(
        HttpRequest request,
        BridgeRuntime runtime,
        Func<Task<T>> action)
    {
        if (!CsrfValid(request, runtime.CsrfToken))
            return Results.Json(new { ok = false, error = "CSRF_INVALID" }, statusCode: StatusCodes.Status403Forbidden);

        try
        {
            var result = await action();
            return Results.Json(new { ok = true, result });
        }
        catch (OperationCanceledException) when (request.HttpContext.RequestAborted.IsCancellationRequested)
        {
            return Results.Json(new { ok = false, error = "REQUEST_CANCELLED" }, statusCode: 499);
        }
        catch (Exception error)
        {
            var message = Bound(error.Message);
            return Results.Json(new { ok = false, error = message }, statusCode: StatusCodes.Status400BadRequest);
        }
    }

    private static bool CsrfValid(HttpRequest request, string expected)
    {
        if (!request.Headers.TryGetValue("X-AIO-Bridge-CSRF", out var provided)) return false;
        var left = Encoding.UTF8.GetBytes(provided.ToString());
        var right = Encoding.UTF8.GetBytes(expected);
        return left.Length == right.Length && CryptographicOperations.FixedTimeEquals(left, right);
    }

    private static async Task<int> RunSelfTestAsync()
    {
        try
        {
            var config = await BridgeConfig.LoadAsync();
            config.Validate();
            Console.WriteLine(System.Text.Json.JsonSerializer.Serialize(new
            {
                ok = true,
                platform = "linux",
                configVersion = config.ConfigVersion,
                configPath = BridgeConfig.ConfigPath,
                secretServiceAvailable = LinuxSecretStore.IsAvailable(),
                buildNumber = LinuxBridgeSelfUpdater.CurrentBuildNumber()
            }, BridgeConfig.JsonOptions));
            return 0;
        }
        catch (Exception error)
        {
            Console.Error.WriteLine(Bound(error.ToString()));
            return 1;
        }
    }

    private static string Bound(string? value)
    {
        var text = string.IsNullOrWhiteSpace(value) ? "UNBEKANNTER_FEHLER" : value.Trim();
        return text.Length <= 1000 ? text : text[..1000];
    }
}

public sealed record SecretValueRequest(string? Value);
public sealed record BackblazeCredentialsRequest(string? KeyId, string? ApplicationKey);
public sealed record ToggleRequest(bool Enabled);
