using System.Text.Json;

namespace AioBotWindowsBridge;

public sealed record RuntimeBridgeStatus(
    string State,
    bool BrowserReady,
    bool SupabaseReady,
    DateTimeOffset? LastAttemptAt,
    DateTimeOffset? LastSuccessAt,
    long LastEventSeq,
    int LastEventCount,
    string? LastError,
    string? TargetUrl,
    string WebDashboardState,
    string? WebDashboardError,
    string BackblazeState,
    string? BackblazeError);

public sealed class TelemetryBridgeService : IAsyncDisposable
{
    public const int MaxCatchUpBatches = 8;
    public const int DeepDiagnosticsIntervalSeconds = 30;
    public const int DeepDiagnosticEventLimit = 40;
    public const int V5AutonomousTestDeploymentIntervalSeconds = 15;
    private const int CatchUpDelayMilliseconds = 100;

    private readonly BridgeConfig _config;
    private readonly BrowserLauncher _launcher;
    private readonly CdpAdventureLandClient _browser;
    private readonly CdpWebDashboardConfigurator _dashboard;
    private readonly CdpBackblazeConfigurator _backblaze;
    private readonly SupabaseTelemetrySink _sink;
    private readonly LocalProblemDiagnosticsArchive _diagnostics;
    private readonly ProblemDiagnosticsMirrorOutbox _problemMirror;
    private readonly string? _dashboardWriteKey;
    private readonly BackblazeCredentials? _backblazeCredentials;
    private CancellationTokenSource? _loopCts;
    private Task? _loopTask;

    public TelemetryBridgeService(
        HttpClient httpClient,
        BridgeConfig config,
        string token,
        string? dashboardWriteKey = null,
        BackblazeCredentials? backblazeCredentials = null)
    {
        _config = config;
        _launcher = new BrowserLauncher(httpClient, config);
        _browser = new CdpAdventureLandClient(httpClient, config);
        _dashboard = new CdpWebDashboardConfigurator(httpClient, config);
        _backblaze = new CdpBackblazeConfigurator(httpClient, config);
        _sink = new SupabaseTelemetrySink(httpClient, config, token);
        _diagnostics = new LocalProblemDiagnosticsArchive(config);
        _problemMirror = new ProblemDiagnosticsMirrorOutbox(
            new SupabaseProblemDiagnosticsSink(httpClient, config, token));
        _dashboardWriteKey = SecureDashboardWriteKeyStore.IsValidWriteKey(dashboardWriteKey)
            ? dashboardWriteKey
            : null;
        _backblazeCredentials = backblazeCredentials is { IsValid: true }
            ? backblazeCredentials
            : null;
    }

    public event Action<RuntimeBridgeStatus>? StatusChanged;
    public bool IsRunning => _loopTask is { IsCompleted: false };

    public Task StartAsync()
    {
        if (IsRunning) return Task.CompletedTask;
        _loopCts = new CancellationTokenSource();
        _loopTask = Task.Run(() => RunAsync(_loopCts.Token));
        return Task.CompletedTask;
    }

    public async Task StopAsync()
    {
        if (_loopCts is null || _loopTask is null) return;
        _loopCts.Cancel();
        try { await _loopTask; }
        catch (OperationCanceledException) { }
        _loopCts.Dispose();
        _loopCts = null;
        _loopTask = null;
        Publish(new RuntimeBridgeStatus(
            "STOPPED", false, false, null, null, 0, 0, null, null,
            DashboardInitialState(), null,
            BackblazeInitialState(), null));
    }

    private async Task RunAsync(CancellationToken cancellationToken)
    {
        var state = await BridgeState.LoadAsync(cancellationToken);
        DateTimeOffset? lastSuccess = null;
        DateTimeOffset? lastDeepDiagnosticsAt = null;
        DateTimeOffset? lastV5UploadAt = null;
        string? lastV5TerminalFingerprint = null;
        DateTimeOffset? lastV5DeploymentAttemptAt = null;
        var failures = 0;

        while (!cancellationToken.IsCancellationRequested)
        {
            var attempt = DateTimeOffset.UtcNow;
            var browserReady = false;
            var dashboardState = DashboardInitialState();
            string? dashboardError = null;
            var backblazeState = BackblazeInitialState();
            string? backblazeError = null;
            try
            {
                Publish(new RuntimeBridgeStatus(
                    "CONNECTING", false, false, attempt, lastSuccess, state.LastEventSeq, 0, null, null,
                    dashboardState, null,
                    backblazeState, null));
                var browserConnection = await _launcher.EnsureReadyAsync(cancellationToken);
                browserReady = browserConnection.Ready;
                if (!browserReady) throw new InvalidOperationException(browserConnection.State);

                var deployNow = DateTimeOffset.UtcNow;
                if (ShouldEnsureV5AutonomousTestDeployment(lastV5DeploymentAttemptAt, deployNow))
                {
                    await EnsureV5AutonomousTestDeploymentSafeAsync(cancellationToken);
                    await EnsureLegacyPr206RosterRecoverySafeAsync(cancellationToken);
                    lastV5DeploymentAttemptAt = deployNow;
                }

                (dashboardState, dashboardError) = await SyncDashboardProfileAsync(cancellationToken);
                (backblazeState, backblazeError) = await SyncBackblazeProfileAsync(cancellationToken);

                RuntimeBridgeStatus? latestStatus = null;
                for (var batchIndex = 0; batchIndex < MaxCatchUpBatches; batchIndex++)
                {
                    var now = DateTimeOffset.UtcNow;
                    var includeDeepDiagnostics = ShouldIncludeDeepDiagnostics(lastDeepDiagnosticsAt, now);
                    var readLimit = EventLimitForRead(_config.EventLimit, includeDeepDiagnostics);
                    var read = await _browser.ReadAsync(
                        state.LastEventSeq,
                        readLimit,
                        includeDeepDiagnostics,
                        cancellationToken);

                    await CaptureDiagnosticsSafeAsync(read, cancellationToken);

                    var v5Transport = ReadV5TransportState(read.Snapshot);
                    if (v5Transport.IsV5
                        && !ShouldUploadV5(
                            lastV5UploadAt,
                            _config.SupabaseStatusIntervalSeconds,
                            now,
                            v5Transport.TerminalFingerprint,
                            lastV5TerminalFingerprint))
                    {
                        latestStatus = new RuntimeBridgeStatus(
                            "V5_LOCAL_OBSERVE",
                            true,
                            lastSuccess.HasValue,
                            attempt,
                            lastSuccess,
                            state.LastEventSeq,
                            read.EventCount,
                            null,
                            read.TargetUrl,
                            dashboardState,
                            dashboardError,
                            backblazeState,
                            backblazeError);
                        Publish(latestStatus);
                        await SaveStatusAsync(latestStatus, cancellationToken);
                        break;
                    }

                    // During catch-up an empty second read is only a probe that the backlog is gone.
                    // Avoid creating an extra empty Supabase row unless this is the normal poll or a deep diagnostic sample is due.
                    if (batchIndex > 0 && read.EventCount == 0 && !includeDeepDiagnostics)
                        break;

                    // Supabase acceptance is the commit point. We never acknowledge browser telemetry before this succeeds.
                    await _sink.SendAsync(read, read.EffectiveAfterSeq, cancellationToken);

                    state = new BridgeState(read.MaxSeq);
                    await state.SaveAsync(cancellationToken);

                    // Sequence-aware acknowledgement is best effort for older bot bundles and exact for new bundles.
                    if (state.LastEventSeq > 0)
                        await _browser.AcknowledgeThroughAsync(state.LastEventSeq, cancellationToken);

                    await FlushDiagnosticsSafeAsync(cancellationToken);

                    failures = 0;
                    lastSuccess = DateTimeOffset.UtcNow;
                    if (includeDeepDiagnostics) lastDeepDiagnosticsAt = lastSuccess;
                    if (v5Transport.IsV5)
                    {
                        lastV5UploadAt = lastSuccess;
                        if (!string.IsNullOrWhiteSpace(v5Transport.TerminalFingerprint))
                            lastV5TerminalFingerprint = v5Transport.TerminalFingerprint;
                    }

                    latestStatus = new RuntimeBridgeStatus(
                        read.HasMoreEvents ? "CATCHING_UP" : "HEALTHY",
                        true,
                        true,
                        attempt,
                        lastSuccess,
                        state.LastEventSeq,
                        read.EventCount,
                        null,
                        read.TargetUrl,
                        dashboardState,
                        dashboardError,
                        backblazeState,
                        backblazeError);
                    Publish(latestStatus);
                    await SaveStatusAsync(latestStatus, cancellationToken);

                    if (v5Transport.IsV5
                        || !ShouldCatchUp(read.EventCount, readLimit, read.HasMoreEvents, batchIndex + 1))
                        break;

                    await Task.Delay(TimeSpan.FromMilliseconds(CatchUpDelayMilliseconds), cancellationToken);
                }

                if (latestStatus is null)
                {
                    latestStatus = new RuntimeBridgeStatus(
                        "HEALTHY", true, true, attempt, lastSuccess, state.LastEventSeq, 0, null, null,
                        dashboardState, dashboardError,
                        backblazeState, backblazeError);
                    Publish(latestStatus);
                    await SaveStatusAsync(latestStatus, cancellationToken);
                }

                await Task.Delay(TimeSpan.FromSeconds(_config.PollIntervalSeconds), cancellationToken);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception error)
            {
                await CaptureBridgeFailureSafeAsync(error);
                failures++;
                var message = Bounded(error.Message);
                var status = new RuntimeBridgeStatus(
                    "DEGRADED", browserReady, false, attempt, lastSuccess, state.LastEventSeq, 0, message, null,
                    dashboardState, dashboardError,
                    backblazeState, backblazeError);
                Publish(status);
                await SaveStatusAsync(status, CancellationToken.None);
                var backoff = ComputeBackoffSeconds(_config.PollIntervalSeconds, _config.MaxBackoffSeconds, failures);
                await Task.Delay(TimeSpan.FromSeconds(backoff), cancellationToken);
            }
        }
    }

    private async Task EnsureV5AutonomousTestDeploymentSafeAsync(CancellationToken cancellationToken)
    {
        try
        {
            var result = await _browser.EnsureV5AutonomousTestAsync(cancellationToken);
            _browser.RecordV5AutonomousTestDeploymentResult(result);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception error)
        {
            _browser.RecordV5AutonomousTestDeploymentFailure(error);
            // Test deployment is fail-closed and independent from observational telemetry.
            // A download/hash/session failure must never become a gameplay retry or stop telemetry.
        }
    }

    private async Task EnsureLegacyPr206RosterRecoverySafeAsync(CancellationToken cancellationToken)
    {
        try
        {
            await _browser.EnsureLegacyPr206RosterRecoveryAsync(cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch
        {
            // This is a one-purpose host lifecycle recovery for the legacy PR20.6
            // roster wait. It never authorizes gameplay and must never block telemetry.
        }
    }

    public static bool ShouldEnsureV5AutonomousTestDeployment(
        DateTimeOffset? lastAttemptAt,
        DateTimeOffset now)
    {
        if (!lastAttemptAt.HasValue) return true;
        return now - lastAttemptAt.Value
            >= TimeSpan.FromSeconds(V5AutonomousTestDeploymentIntervalSeconds);
    }

    private async Task CaptureDiagnosticsSafeAsync(DebugReadResult read, CancellationToken cancellationToken)
    {
        try
        {
            if (await _diagnostics.CaptureFromReadAsync(read, cancellationToken))
                await _problemMirror.EnqueueLatestAsync(cancellationToken);
        }
        catch
        {
            // Diagnostics are observational only and never block telemetry or gameplay.
        }
    }

    private async Task FlushDiagnosticsSafeAsync(CancellationToken cancellationToken)
    {
        try
        {
            await _problemMirror.FlushPendingAsync(cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch
        {
            // Local bundles and mirror payloads remain bounded and are retried later.
        }
    }

    private async Task CaptureBridgeFailureSafeAsync(Exception error)
    {
        try
        {
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(12));
            if (await _diagnostics.CaptureBridgeFailureAsync(error, cts.Token))
                await _problemMirror.EnqueueLatestAsync(cts.Token);
            await _problemMirror.FlushPendingAsync(cts.Token);
        }
        catch
        {
            // Never turn a diagnostics failure into a second bridge failure.
        }
    }

    private async Task<(string State, string? Error)> SyncDashboardProfileAsync(CancellationToken cancellationToken)
    {
        try
        {
            if (!_config.WebDashboardEnabled)
            {
                await _dashboard.ClearAsync(cancellationToken);
                return ("DISABLED", null);
            }

            if (!SecureDashboardWriteKeyStore.IsValidWriteKey(_dashboardWriteKey))
            {
                await _dashboard.ClearAsync(cancellationToken);
                return ("WRITE_KEY_MISSING", null);
            }

            var result = await _dashboard.ApplyAsync(
                _config.WebDashboardBaseUrl,
                _config.WebDashboardAccount,
                _dashboardWriteKey!,
                cancellationToken);
            return result.Applied ? ("READY", null) : ("ERROR", "WEB_DASHBOARD_PROFILE_NOT_APPLIED");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception error)
        {
            return ("ERROR", Bounded(error.Message));
        }
    }

    private async Task<(string State, string? Error)> SyncBackblazeProfileAsync(CancellationToken cancellationToken)
    {
        try
        {
            if (!_config.BackblazeEnabled)
            {
                await _backblaze.ClearAsync(cancellationToken);
                return ("DISABLED", null);
            }

            if (_backblazeCredentials is not { IsValid: true })
            {
                await _backblaze.ClearAsync(cancellationToken);
                return ("CREDENTIALS_MISSING", null);
            }

            var result = await _backblaze.ApplyAsync(
                _config.BackblazeEndpoint,
                _config.BackblazeRegion,
                _config.BackblazeBucket,
                _config.BackblazePrefix,
                _backblazeCredentials,
                cancellationToken);
            return result.Applied ? ("READY", null) : ("ERROR", "BACKBLAZE_PROFILE_NOT_APPLIED");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception error)
        {
            return ("ERROR", Bounded(error.Message));
        }
    }

    private string DashboardInitialState()
    {
        if (!_config.WebDashboardEnabled) return "DISABLED";
        return SecureDashboardWriteKeyStore.IsValidWriteKey(_dashboardWriteKey)
            ? "PENDING"
            : "WRITE_KEY_MISSING";
    }

    private string BackblazeInitialState()
    {
        if (!_config.BackblazeEnabled) return "DISABLED";
        return _backblazeCredentials is { IsValid: true }
            ? "PENDING"
            : "CREDENTIALS_MISSING";
    }

    private async Task SaveStatusAsync(RuntimeBridgeStatus status, CancellationToken cancellationToken)
    {
        await new BridgeStatus(
            status.State,
            _config.BotId,
            true,
            status.BrowserReady,
            status.SupabaseReady,
            status.LastAttemptAt,
            status.LastSuccessAt,
            status.LastEventSeq,
            status.LastEventCount,
            status.LastError,
            status.TargetUrl,
            status.WebDashboardState,
            status.WebDashboardError,
            status.BackblazeState,
            status.BackblazeError).SaveAsync(cancellationToken);
    }

    private void Publish(RuntimeBridgeStatus status) => StatusChanged?.Invoke(status);

    private sealed record V5TransportState(bool IsV5, string? TerminalFingerprint);

    private static V5TransportState ReadV5TransportState(JsonElement snapshot)
    {
        if (snapshot.ValueKind != JsonValueKind.Object
            || !snapshot.TryGetProperty("status", out var statusNode)
            || statusNode.ValueKind != JsonValueKind.Object
            || !statusNode.TryGetProperty("v5AutonomousTest", out var v5)
            || v5.ValueKind != JsonValueKind.Object)
            return new V5TransportState(false, null);

        var terminal = v5.TryGetProperty("terminal", out var terminalNode)
            && terminalNode.ValueKind == JsonValueKind.True;
        if (!terminal) return new V5TransportState(true, null);

        var testId = v5.TryGetProperty("testId", out var testNode)
            ? testNode.GetString() ?? "unknown"
            : "unknown";
        var status = v5.TryGetProperty("status", out var statusValue)
            ? statusValue.GetString() ?? "UNKNOWN"
            : "UNKNOWN";
        var startedAt = v5.TryGetProperty("startedAtMs", out var startedNode)
            && startedNode.TryGetInt64(out var started)
            ? started
            : 0;

        return new V5TransportState(true, $"{testId}|{startedAt}|{status}");
    }

    public static bool ShouldUploadV5(
        DateTimeOffset? lastUploadAt,
        int statusIntervalSeconds,
        DateTimeOffset now,
        string? terminalFingerprint,
        string? lastTerminalFingerprint)
    {
        var regularDue = !lastUploadAt.HasValue
            || now - lastUploadAt.Value >= TimeSpan.FromSeconds(statusIntervalSeconds);
        var terminalDue = !string.IsNullOrWhiteSpace(terminalFingerprint)
            && !string.Equals(terminalFingerprint, lastTerminalFingerprint, StringComparison.Ordinal);
        return regularDue || terminalDue;
    }

    public static int EventLimitForRead(int configuredEventLimit, bool includeDeepDiagnostics)
    {
        var bounded = Math.Clamp(configuredEventLimit, 1, 200);
        return includeDeepDiagnostics ? Math.Min(bounded, DeepDiagnosticEventLimit) : bounded;
    }

    public static bool ShouldCatchUp(int eventCount, int eventLimit, bool hasMoreEvents, int completedBatches)
    {
        if (completedBatches >= MaxCatchUpBatches) return false;
        var boundedLimit = Math.Max(1, eventLimit);
        return hasMoreEvents || eventCount >= boundedLimit;
    }

    public static bool ShouldIncludeDeepDiagnostics(DateTimeOffset? lastDeepDiagnosticsAt, DateTimeOffset now)
    {
        if (!lastDeepDiagnosticsAt.HasValue) return true;
        return now - lastDeepDiagnosticsAt.Value >= TimeSpan.FromSeconds(DeepDiagnosticsIntervalSeconds);
    }

    public static int ComputeBackoffSeconds(int pollIntervalSeconds, int maxBackoffSeconds, int failures)
    {
        var exponent = Math.Min(8, Math.Max(0, failures - 1));
        var delay = pollIntervalSeconds * Math.Pow(2, exponent);
        return (int)Math.Min(maxBackoffSeconds, delay);
    }

    private static string Bounded(string? value)
    {
        var text = string.IsNullOrWhiteSpace(value) ? "WINDOWS_BRIDGE_FAILED" : value;
        return text.Length <= 256 ? text : text[..256];
    }

    public async ValueTask DisposeAsync() => await StopAsync();
}
