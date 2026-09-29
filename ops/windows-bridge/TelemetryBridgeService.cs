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
    public const bool LiveTransportIncludesDeepDiagnostics = false;
    private const int CatchUpDelayMilliseconds = 100;

    private readonly BridgeConfig _config;
    private readonly BrowserLauncher _launcher;
    private readonly CdpAlBotV6Client _browser;
    private readonly CdpWebDashboardConfigurator _dashboard;
    private readonly SupabaseTelemetrySink _sink;
    private readonly CloudflareV6DashboardSink? _dashboardSink;
    private readonly LocalProblemDiagnosticsArchive _diagnostics;
    private readonly ProblemDiagnosticsMirrorOutbox _problemMirror;
    private readonly string? _dashboardWriteKey;
    private readonly BackblazeV6ArchiveSink? _backblazeSink;
    private DateTimeOffset? _lastBackblazeArchiveAt;
    private CancellationTokenSource? _loopCts;
    private Task? _loopTask;
    private bool _legacyDashboardProfileCleared;

    public TelemetryBridgeService(
        HttpClient httpClient,
        BridgeConfig config,
        string token,
        string? dashboardWriteKey = null,
        BackblazeCredentials? backblazeCredentials = null)
    {
        _config = config;
        _launcher = new BrowserLauncher(httpClient, config);
        _browser = new CdpAlBotV6Client(httpClient, config);
        _dashboard = new CdpWebDashboardConfigurator(httpClient, config);
        _sink = new SupabaseTelemetrySink(httpClient, config, token);
        _diagnostics = new LocalProblemDiagnosticsArchive(config);
        _problemMirror = new ProblemDiagnosticsMirrorOutbox(
            new SupabaseProblemDiagnosticsSink(httpClient, config, token));
        _dashboardWriteKey = SecureDashboardWriteKeyStore.IsValidWriteKey(dashboardWriteKey)
            ? dashboardWriteKey
            : null;
        _dashboardSink = config.WebDashboardEnabled && _dashboardWriteKey is not null
            ? new CloudflareV6DashboardSink(httpClient, config, _dashboardWriteKey)
            : null;
        // V6 Backblaze is host-side only. Credentials remain DPAPI-protected in the
        // Windows Bridge and are never injected into Adventure Land.
        _backblazeSink = config.BackblazeEnabled && backblazeCredentials is { IsValid: true }
            ? new BackblazeV6ArchiveSink(httpClient, config, backblazeCredentials)
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
                // CONNECTING is an initial-start state. Once we have completed a healthy
                // cycle, keep the last healthy UI state visible while the next poll probes
                // browser/CDP/Supabase. A real failure is published as DEGRADED below.
                if (ShouldPublishConnecting(lastSuccess))
                {
                    Publish(new RuntimeBridgeStatus(
                        "CONNECTING", false, false, attempt, lastSuccess, state.LastEventSeq, 0, null, null,
                        dashboardState, null,
                        backblazeState, null));
                }

                var browserConnection = await _launcher.EnsureReadyAsync(cancellationToken);
                browserReady = browserConnection.Ready;
                if (!browserReady) throw new InvalidOperationException(browserConnection.State);

                (dashboardState, dashboardError) = await SyncDashboardProfileAsync(cancellationToken);
                (backblazeState, backblazeError) = BackblazeCurrentState();

                RuntimeBridgeStatus? latestStatus = null;
                for (var batchIndex = 0; batchIndex < MaxCatchUpBatches; batchIndex++)
                {
                    // The live transport must stay bounded and fast. Deep snapshots can
                    // exceed the CDP response budget and are observational only, so they
                    // are never part of the Supabase/Cloudflare commit path.
                    var includeDeepDiagnostics = LiveTransportIncludesDeepDiagnostics;
                    var readLimit = EventLimitForRead(_config.EventLimit, includeDeepDiagnostics);
                    var reads = await _browser.ReadAllAsync(
                        character => state.GetLastEventSeq(character),
                        readLimit,
                        includeDeepDiagnostics,
                        cancellationToken);

                    var processed = 0;
                    var totalEventCount = 0;
                    var hasMoreEvents = false;
                    string? targetUrl = null;

                    foreach (var read in reads)
                    {
                        var characterName = CdpAlBotV6Client.ReadCharacterName(read.Snapshot);
                        if (string.IsNullOrWhiteSpace(characterName))
                            continue;

                        hasMoreEvents |= read.HasMoreEvents;

                        // During catch-up an empty follow-up read is only a probe that
                        // this character's backlog is gone. The first poll still sends
                        // an empty snapshot so the dashboard receives live presence.
                        if (batchIndex > 0 && read.EventCount == 0 && !includeDeepDiagnostics)
                            continue;

                        await CaptureDiagnosticsSafeAsync(read, cancellationToken);

                        // Supabase acceptance is the commit point. Cloudflare is
                        // observability-only and must never block cursor persistence or ACK.
                        await _sink.SendAsync(read, read.EffectiveAfterSeq, cancellationToken);

                        var dashboardResult = await SendDashboardSafeAsync(read, cancellationToken);
                        if (dashboardResult.State == "ERROR"
                            || dashboardState != "ERROR")
                        {
                            dashboardState = dashboardResult.State;
                            dashboardError = dashboardResult.Error;
                        }

                        var archiveResult = await ArchiveBackblazeSafeAsync(read, cancellationToken);
                        if (archiveResult.State == "ERROR"
                            || backblazeState != "ERROR")
                        {
                            backblazeState = archiveResult.State;
                            backblazeError = archiveResult.Error;
                        }

                        state = state.WithCharacterSeq(characterName, read.MaxSeq);
                        await state.SaveAsync(cancellationToken);

                        if (read.MaxSeq > 0)
                            await _browser.AcknowledgeThroughAsync(characterName, read.MaxSeq, cancellationToken);

                        totalEventCount += read.EventCount;
                        targetUrl ??= read.TargetUrl;
                        processed++;
                    }

                    if (processed == 0)
                        break;

                    await FlushDiagnosticsSafeAsync(cancellationToken);

                    failures = 0;
                    lastSuccess = DateTimeOffset.UtcNow;
                    latestStatus = new RuntimeBridgeStatus(
                        hasMoreEvents ? "CATCHING_UP" : "HEALTHY",
                        true,
                        true,
                        attempt,
                        lastSuccess,
                        state.LastEventSeq,
                        totalEventCount,
                        null,
                        targetUrl,
                        dashboardState,
                        dashboardError,
                        backblazeState,
                        backblazeError);
                    Publish(latestStatus);
                    await SaveStatusAsync(latestStatus, cancellationToken);

                    var shouldCatchUp = reads.Any(read =>
                        ShouldCatchUp(read.EventCount, readLimit, read.HasMoreEvents, batchIndex + 1));
                    if (!shouldCatchUp)
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

                // Deep diagnostics are explicitly best-effort and run only after a
                // successful live cycle. Their size or availability must never move
                // BOT/Supabase/Webinterface back to DEGRADED.
                var diagnosticsNow = DateTimeOffset.UtcNow;
                if (lastSuccess.HasValue
                    && ShouldIncludeDeepDiagnostics(lastDeepDiagnosticsAt, diagnosticsNow))
                {
                    lastDeepDiagnosticsAt = diagnosticsNow;
                    await CaptureDeepDiagnosticsBestEffortAsync(state, cancellationToken);
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

    private async Task CaptureDeepDiagnosticsBestEffortAsync(
        BridgeState state,
        CancellationToken cancellationToken)
    {
        try
        {
            var reads = await _browser.ReadAllAsync(
                character => state.GetLastEventSeq(character),
                DeepDiagnosticEventLimit,
                includeDeepDiagnostics: true,
                cancellationToken);
            foreach (var read in reads)
                await CaptureDiagnosticsSafeAsync(read, cancellationToken);
            await FlushDiagnosticsSafeAsync(cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch
        {
            // Deep diagnostics are observational only. A large deep snapshot,
            // transient CDP issue, or diagnostics sink failure must never block
            // shallow live telemetry, ACK, Supabase, or the Cloudflare dashboard.
        }
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
                if (!_legacyDashboardProfileCleared)
                {
                    await _dashboard.ClearAsync(cancellationToken);
                    _legacyDashboardProfileCleared = true;
                }
                return ("DISABLED", null);
            }

            if (_dashboardSink is null)
            {
                if (!_legacyDashboardProfileCleared)
                {
                    await _dashboard.ClearAsync(cancellationToken);
                    _legacyDashboardProfileCleared = true;
                }
                return ("WRITE_KEY_MISSING", null);
            }

            // V6 never injects the Cloudflare write key into Adventure Land.
            // Remove any historical V3 browser profile once, then use the host-side sink.
            if (!_legacyDashboardProfileCleared)
            {
                await _dashboard.ClearAsync(cancellationToken);
                _legacyDashboardProfileCleared = true;
            }
            return ("READY", null);
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

    private async Task<(string State, string? Error)> SendDashboardSafeAsync(
        DebugReadResult read,
        CancellationToken cancellationToken)
    {
        if (!_config.WebDashboardEnabled)
            return ("DISABLED", null);
        if (_dashboardSink is null)
            return ("WRITE_KEY_MISSING", "WEB_DASHBOARD_WRITE_KEY_REQUIRED");

        try
        {
            await _dashboardSink.SendAsync(read, cancellationToken);
            return ("READY", null);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception error)
        {
            // The dashboard is observability-only. Supabase remains the commit
            // point, so Cloudflare outages or key rotation never block telemetry ACK.
            return ("ERROR", Bounded(error.Message));
        }
    }

    private async Task<(string State, string? Error)> ArchiveBackblazeSafeAsync(
        DebugReadResult read,
        CancellationToken cancellationToken)
    {
        if (!_config.BackblazeEnabled)
            return ("DISABLED", null);
        if (_backblazeSink is null)
            return ("CREDENTIALS_MISSING", "BACKBLAZE_V6_CREDENTIALS_REQUIRED");
        if (!BackblazeV6ArchiveSink.ShouldArchive(read, _lastBackblazeArchiveAt, DateTimeOffset.UtcNow))
            return ("READY", null);

        try
        {
            var result = await _backblazeSink.ArchiveAsync(read, cancellationToken);
            if (!result.Stored || !result.Verified)
                return ("ERROR", "BACKBLAZE_V6_ARCHIVE_NOT_VERIFIED");
            _lastBackblazeArchiveAt = DateTimeOffset.UtcNow;
            return ("READY", null);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception error)
        {
            // Backblaze is an additional archive path. Supabase remains the telemetry
            // commit/ACK authority, so archive outages never block bot telemetry.
            return ("ERROR", Bounded(error.Message));
        }
    }

    private (string State, string? Error) BackblazeCurrentState()
    {
        if (!_config.BackblazeEnabled) return ("DISABLED", null);
        return _backblazeSink is null
            ? ("CREDENTIALS_MISSING", "BACKBLAZE_V6_CREDENTIALS_REQUIRED")
            : ("PENDING", null);
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
        return _backblazeSink is null ? "CREDENTIALS_MISSING" : "PENDING";
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

    public static bool ShouldPublishConnecting(DateTimeOffset? lastSuccess) =>
        !lastSuccess.HasValue;

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
        return text.Length <= 512 ? text : text[..512];
    }

    public async ValueTask DisposeAsync() => await StopAsync();
}
