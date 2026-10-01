using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

namespace AioBotWindowsBridge;

public sealed record CharacterLifecycleRow(
    string Name,
    string Ctype,
    bool Online,
    string? Server,
    string? CodeSlot);

public sealed record CharacterSupervisorResult(
    string State,
    string? MerchantName,
    IReadOnlyList<string> ActiveNames,
    IReadOnlyList<string> ManagedNames,
    string? ActionCharacter,
    string? Detail)
{
    public bool ActionRequested =>
        State is "MERCHANT_NAVIGATION_REQUESTED"
            or "CHARACTER_START_REQUESTED"
            or "CHARACTER_CODE_RESTART_REQUESTED";
}

public sealed class CdpCharacterSupervisor
{
    public const int ExpectedMerchantCount = 1;
    public const int ExpectedFarmerCount = 3;

    private static readonly HashSet<string> PresentStates = new(StringComparer.OrdinalIgnoreCase)
    {
        "self", "starting", "loading", "active", "code"
    };

    private static readonly HashSet<string> CombatClasses = new(StringComparer.OrdinalIgnoreCase)
    {
        "warrior", "paladin", "rogue", "ranger", "mage", "priest"
    };

    private readonly HttpClient _http;
    private readonly BridgeConfig _config;
    private long _commandId;

    public CdpCharacterSupervisor(HttpClient http, BridgeConfig config)
    {
        _http = http;
        _config = config;
    }

    public static bool IsActiveState(string? value) =>
        !string.IsNullOrWhiteSpace(value) && PresentStates.Contains(value.Trim());

    public static bool IsCodeActiveState(
        string? value,
        bool localCodeActive,
        bool isLocalCharacter)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;
        var state = value.Trim();
        if (string.Equals(state, "code", StringComparison.OrdinalIgnoreCase)) return true;
        return isLocalCharacter
            && string.Equals(state, "self", StringComparison.OrdinalIgnoreCase)
            && localCodeActive;
    }

    public static bool IsCombatClass(string? value) =>
        !string.IsNullOrWhiteSpace(value) && CombatClasses.Contains(value.Trim());

    public static bool IsHealthyRuntimeComposition(IEnumerable<(string Name, string Ctype, bool Running)> rows)
    {
        var unique = rows
            .Where(row => !string.IsNullOrWhiteSpace(row.Name))
            .GroupBy(row => row.Name, StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First())
            .ToArray();
        return unique.Length == ExpectedMerchantCount + ExpectedFarmerCount
            && unique.Count(row => row.Running && string.Equals(row.Ctype, "merchant", StringComparison.OrdinalIgnoreCase)) == ExpectedMerchantCount
            && unique.Count(row => row.Running && IsCombatClass(row.Ctype)) == ExpectedFarmerCount
            && unique.All(row => row.Running);
    }

    public async Task<CharacterSupervisorResult> EnsureAsync(
        IReadOnlyCollection<string>? managedNames,
        CancellationToken cancellationToken)
    {
        if (!_config.CharacterSupervisorEnabled)
            return new CharacterSupervisorResult(
                "DISABLED", null, Array.Empty<string>(), Array.Empty<string>(), null, null);

        var target = await FindLifecycleTargetAsync(cancellationToken);
        if (target is null)
            return new CharacterSupervisorResult(
                "WAITING_FOR_ADVENTURE_LAND_PAGE", null, Array.Empty<string>(),
                NormalizeNames(managedNames), null, "ADVENTURE_LAND_PAGE_UNAVAILABLE");

        LifecycleSnapshot snapshot;
        try
        {
            var value = await EvaluateAsync(target.WebSocketDebuggerUrl, InspectExpression, cancellationToken);
            snapshot = ParseSnapshot(value);
        }
        catch (Exception error) when (error is InvalidOperationException or WebSocketException or JsonException)
        {
            return new CharacterSupervisorResult(
                "INSPECTION_FAILED", null, Array.Empty<string>(), NormalizeNames(managedNames),
                null, Bound(error.Message));
        }

        var managed = NormalizeNames(managedNames);
        var activeNames = snapshot.Active
            .Where(row => IsActiveState(row.Value))
            .Select(row => row.Key)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(value => value, StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (snapshot.Characters.Count == 0)
            return new CharacterSupervisorResult(
                "WAITING_FOR_ACCOUNT_SESSION", null, activeNames, managed, null,
                "ACCOUNT_ROSTER_UNAVAILABLE");

        var merchants = snapshot.Characters
            .Where(row => string.Equals(row.Ctype, "merchant", StringComparison.OrdinalIgnoreCase))
            .OrderBy(row => row.Name, StringComparer.OrdinalIgnoreCase)
            .ToArray();
        if (merchants.Length != 1)
            return new CharacterSupervisorResult(
                "MERCHANT_ROSTER_AMBIGUOUS", null, activeNames, managed, null,
                "EXPECTED_ONE_MERCHANT_FOUND_" + merchants.Length);

        var merchant = merchants[0];
        var merchantPresent = snapshot.Active.TryGetValue(merchant.Name, out var merchantState)
            && IsActiveState(merchantState);

        if (merchantPresent
            && !IsCodeActiveState(
                merchantState,
                snapshot.LocalCodeActive,
                string.Equals(snapshot.LocalName, merchant.Name, StringComparison.OrdinalIgnoreCase)))
        {
            if (string.Equals(merchantState, "starting", StringComparison.OrdinalIgnoreCase)
                || string.Equals(merchantState, "loading", StringComparison.OrdinalIgnoreCase))
            {
                return new CharacterSupervisorResult(
                    "MERCHANT_CODE_STARTING", merchant.Name, activeNames, managed,
                    null, "STATE=" + merchantState);
            }

            var restartMerchant = await EvaluateAsync(
                target.WebSocketDebuggerUrl,
                BuildRestartCodeExpression(merchant.Name, ResolveCodeSlot(merchant)),
                cancellationToken);
            if (!ReadAccepted(restartMerchant))
                return new CharacterSupervisorResult(
                    "MERCHANT_START_BLOCKED", merchant.Name, activeNames, managed, null,
                    ReadReason(restartMerchant) ?? "MERCHANT_CODE_RESTART_REJECTED");
            return new CharacterSupervisorResult(
                "CHARACTER_CODE_RESTART_REQUESTED", merchant.Name, activeNames, managed,
                merchant.Name, "MERCHANT_CODE_INACTIVE");
        }

        if (!merchantPresent)
        {
            if (merchant.Online)
            {
                return new CharacterSupervisorResult(
                    "MERCHANT_ONLINE_OUTSIDE_LOCAL_RUNNERS", merchant.Name, activeNames, managed,
                    null, "MERCHANT_ALREADY_ONLINE");
            }

            var slot = ResolveCodeSlot(merchant);
            if (string.IsNullOrWhiteSpace(snapshot.LocalName))
            {
                if (string.IsNullOrWhiteSpace(snapshot.ServerRegion)
                    || string.IsNullOrWhiteSpace(snapshot.ServerIdentifier))
                {
                    return new CharacterSupervisorResult(
                        "MERCHANT_START_BLOCKED", merchant.Name, activeNames, managed, null,
                        "SERVER_SELECTION_UNAVAILABLE");
                }

                var navigate = BuildMerchantNavigationExpression(
                    merchant.Name,
                    snapshot.ServerRegion,
                    snapshot.ServerIdentifier,
                    slot);
                var result = await EvaluateAsync(target.WebSocketDebuggerUrl, navigate, cancellationToken);
                if (!ReadAccepted(result))
                    return new CharacterSupervisorResult(
                        "MERCHANT_START_BLOCKED", merchant.Name, activeNames, managed, null,
                        ReadReason(result) ?? "MERCHANT_NAVIGATION_REJECTED");
                return new CharacterSupervisorResult(
                    "MERCHANT_NAVIGATION_REQUESTED", merchant.Name, activeNames, managed,
                    merchant.Name, "COLD_START");
            }

            var startMerchant = await EvaluateAsync(
                target.WebSocketDebuggerUrl,
                BuildStartCharacterExpression(merchant.Name, slot),
                cancellationToken);
            if (!ReadAccepted(startMerchant))
                return new CharacterSupervisorResult(
                    "MERCHANT_START_BLOCKED", merchant.Name, activeNames, managed, null,
                    ReadReason(startMerchant) ?? "MERCHANT_START_REJECTED");
            return new CharacterSupervisorResult(
                "CHARACTER_START_REQUESTED", merchant.Name, activeNames, managed,
                merchant.Name, "MERCHANT");
        }

        // On the first healthy installation the bot remains authoritative for farmer
        // selection. Once a four-character set has been observed and persisted, the
        // Bridge may recover missing members of exactly that set.
        if (managed.Count != ExpectedMerchantCount + ExpectedFarmerCount)
            return new CharacterSupervisorResult(
                "MERCHANT_READY_WAITING_FOR_MANAGED_ROSTER", merchant.Name, activeNames,
                managed, null, null);

        var accountByName = snapshot.Characters.ToDictionary(row => row.Name, StringComparer.OrdinalIgnoreCase);
        foreach (var name in managed)
        {
            if (!accountByName.TryGetValue(name, out var row))
                return new CharacterSupervisorResult(
                    "MANAGED_ROSTER_BLOCKED", merchant.Name, activeNames, managed, null,
                    "ACCOUNT_CHARACTER_MISSING:" + Bound(name));

            if (snapshot.Active.TryGetValue(name, out var state) && IsActiveState(state))
            {
                var isLocal = string.Equals(snapshot.LocalName, name, StringComparison.OrdinalIgnoreCase);
                if (IsCodeActiveState(state, snapshot.LocalCodeActive, isLocal))
                    continue;

                // starting/loading are transient page lifecycle states. Do not churn
                // the iframe while Adventure Land is still bringing it up.
                if (string.Equals(state, "starting", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(state, "loading", StringComparison.OrdinalIgnoreCase))
                    continue;

                // Adventure Land explicitly reports child "active" when the character
                // is connected but code_active is false, and reports the local page as
                // "self" regardless of code_active. Presence is therefore not runtime
                // health: restart only the CODE layer while preserving the character.
                var restart = await EvaluateAsync(
                    target.WebSocketDebuggerUrl,
                    BuildRestartCodeExpression(row.Name, ResolveCodeSlot(row)),
                    cancellationToken);
                if (!ReadAccepted(restart))
                    return new CharacterSupervisorResult(
                        "MANAGED_ROSTER_BLOCKED", merchant.Name, activeNames, managed, null,
                        ReadReason(restart) ?? ("CODE_RESTART_REJECTED:" + Bound(row.Name)));
                return new CharacterSupervisorResult(
                    "CHARACTER_CODE_RESTART_REQUESTED", merchant.Name, activeNames, managed,
                    row.Name, "MANAGED_RUNTIME_CODE_INACTIVE");
            }

            if (row.Online)
                return new CharacterSupervisorResult(
                    "MANAGED_ROSTER_BLOCKED", merchant.Name, activeNames, managed, null,
                    "CHARACTER_ONLINE_OUTSIDE_LOCAL_RUNNERS:" + Bound(name));

            var start = await EvaluateAsync(
                target.WebSocketDebuggerUrl,
                BuildStartCharacterExpression(row.Name, ResolveCodeSlot(row)),
                cancellationToken);
            if (!ReadAccepted(start))
                return new CharacterSupervisorResult(
                    "MANAGED_ROSTER_BLOCKED", merchant.Name, activeNames, managed, null,
                    ReadReason(start) ?? ("START_REJECTED:" + Bound(row.Name)));
            return new CharacterSupervisorResult(
                "CHARACTER_START_REQUESTED", merchant.Name, activeNames, managed,
                row.Name, "MANAGED_ROSTER_RECOVERY");
        }

        return new CharacterSupervisorResult(
            "ROSTER_ACTIVE", merchant.Name, activeNames, managed, null, null);
    }

    private string ResolveCodeSlot(CharacterLifecycleRow row) =>
        !string.IsNullOrWhiteSpace(row.CodeSlot)
            ? row.CodeSlot!
            : _config.ManagedCodeSlot;

    private async Task<LifecycleTarget?> FindLifecycleTargetAsync(CancellationToken cancellationToken)
    {
        var endpoint = _config.CdpEndpoint.TrimEnd('/') + "/json/list";
        using var response = await _http.GetAsync(endpoint, cancellationToken);
        response.EnsureSuccessStatusCode();
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

        var allowed = new Uri(_config.AllowedOrigin);
        var targets = new List<LifecycleTarget>();
        foreach (var node in document.RootElement.EnumerateArray())
        {
            var type = node.TryGetProperty("type", out var typeNode) ? typeNode.GetString() : null;
            var url = node.TryGetProperty("url", out var urlNode) ? urlNode.GetString() : null;
            var ws = node.TryGetProperty("webSocketDebuggerUrl", out var wsNode) ? wsNode.GetString() : null;
            if (!string.Equals(type, "page", StringComparison.OrdinalIgnoreCase)
                || string.IsNullOrWhiteSpace(url)
                || string.IsNullOrWhiteSpace(ws)
                || !Uri.TryCreate(url, UriKind.Absolute, out var targetUri)
                || !SameOrigin(targetUri, allowed))
                continue;
            targets.Add(new LifecycleTarget(url!, ws!));
        }

        // Prefer a character page when one is already alive, otherwise the root page.
        return targets
            .OrderByDescending(row => row.Url.Contains("/character/", StringComparison.OrdinalIgnoreCase))
            .ThenBy(row => row.Url, StringComparer.OrdinalIgnoreCase)
            .FirstOrDefault();
    }

    private async Task<JsonElement> EvaluateAsync(
        string webSocketDebuggerUrl,
        string expression,
        CancellationToken cancellationToken)
    {
        using var socket = new ClientWebSocket();
        await socket.ConnectAsync(new Uri(webSocketDebuggerUrl), cancellationToken);
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(TimeSpan.FromSeconds(8));
        var token = cts.Token;
        var id = Interlocked.Increment(ref _commandId);
        var payload = JsonSerializer.SerializeToUtf8Bytes(new
        {
            id,
            method = "Runtime.evaluate",
            @params = new
            {
                expression,
                returnByValue = true,
                awaitPromise = true,
                userGesture = false
            }
        });
        await socket.SendAsync(payload, WebSocketMessageType.Text, true, token);

        var buffer = new byte[256 * 1024];
        while (true)
        {
            using var memory = new MemoryStream();
            WebSocketReceiveResult result;
            do
            {
                result = await socket.ReceiveAsync(buffer, token);
                if (result.MessageType == WebSocketMessageType.Close)
                    throw new InvalidOperationException("CDP_SOCKET_CLOSED");
                if (result.Count > 0)
                    memory.Write(buffer, 0, result.Count);
                if (memory.Length > 2 * 1024 * 1024)
                    throw new InvalidOperationException("CDP_RESPONSE_TOO_LARGE");
            } while (!result.EndOfMessage);

            using var document = JsonDocument.Parse(memory.ToArray());
            var root = document.RootElement;
            if (!root.TryGetProperty("id", out var idNode)
                || !idNode.TryGetInt64(out var responseId)
                || responseId != id)
                continue;
            if (root.TryGetProperty("error", out var commandError))
                throw new InvalidOperationException("CDP_COMMAND_FAILED:" + Bound(commandError.ToString()));
            if (!root.TryGetProperty("result", out var commandResult)
                || !commandResult.TryGetProperty("result", out var runtimeResult))
                throw new InvalidOperationException("CDP_RESULT_MISSING");
            if (runtimeResult.TryGetProperty("exceptionDetails", out var exception))
                throw new InvalidOperationException("CDP_EVALUATION_FAILED:" + Bound(exception.ToString()));
            if (!runtimeResult.TryGetProperty("value", out var value))
                throw new InvalidOperationException("CDP_VALUE_MISSING");
            return value.Clone();
        }
    }

    private LifecycleSnapshot ParseSnapshot(JsonElement value)
    {
        if (value.ValueKind != JsonValueKind.Object)
            throw new InvalidOperationException("LIFECYCLE_SNAPSHOT_INVALID");

        var rows = new List<CharacterLifecycleRow>();
        if (value.TryGetProperty("characters", out var characters)
            && characters.ValueKind == JsonValueKind.Array)
        {
            foreach (var row in characters.EnumerateArray())
            {
                if (row.ValueKind != JsonValueKind.Object) continue;
                var name = ReadString(row, "name")?.Trim();
                if (string.IsNullOrWhiteSpace(name)) continue;
                rows.Add(new CharacterLifecycleRow(
                    name,
                    ReadString(row, "ctype")?.Trim().ToLowerInvariant() ?? string.Empty,
                    ReadBool(row, "online"),
                    ReadString(row, "server"),
                    ReadString(row, "codeSlot")));
            }
        }

        var active = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        if (value.TryGetProperty("active", out var activeNode)
            && activeNode.ValueKind == JsonValueKind.Object)
        {
            foreach (var property in activeNode.EnumerateObject())
                active[property.Name] = property.Value.ValueKind == JsonValueKind.String
                    ? property.Value.GetString() ?? string.Empty
                    : property.Value.ToString();
        }

        return new LifecycleSnapshot(
            rows,
            active,
            ReadString(value, "localName"),
            ReadBool(value, "localCodeActive"),
            ReadString(value, "serverRegion"),
            ReadString(value, "serverIdentifier"));
    }

    private static string BuildMerchantNavigationExpression(
        string name,
        string region,
        string identifier,
        string codeSlot)
    {
        var n = JsonSerializer.Serialize(name);
        var r = JsonSerializer.Serialize(region);
        var i = JsonSerializer.Serialize(identifier);
        var s = JsonSerializer.Serialize(codeSlot);
        return $$"""
        (() => {
          const name = {{n}};
          const region = {{r}};
          const identifier = {{i}};
          const slot = {{s}};
          const rows = globalThis.X && Array.isArray(globalThis.X.characters)
            ? globalThis.X.characters : [];
          const owned = rows.find(row => row && String(row.name || '').toLowerCase() === name.toLowerCase());
          if (!owned) return { accepted: false, reason: 'CHARACTER_NOT_OWNED' };
          if (globalThis.character) return { accepted: false, reason: 'LOCAL_CHARACTER_ALREADY_PRESENT' };
          const path = '/character/' + encodeURIComponent(String(owned.name))
            + '/in/' + encodeURIComponent(region)
            + '/' + encodeURIComponent(identifier) + '/'
            + '?code=' + encodeURIComponent(slot);
          // Return the bounded acknowledgement before navigation tears down the
          // execution context/CDP command response.
          globalThis.setTimeout(() => globalThis.location.assign(path), 0);
          return { accepted: true, action: 'NAVIGATE_MERCHANT', name: String(owned.name), path };
        })()
        """;
    }

    private static string BuildRestartCodeExpression(string name, string codeSlot)
    {
        var n = JsonSerializer.Serialize(name);
        var s = JsonSerializer.Serialize(codeSlot);
        const string template = """
        (() => {
          const name = __ALBOT_NAME_JSON__;
          const slot = __ALBOT_SLOT_JSON__;
          const root = globalThis;
          const same = value => String(value || '').toLowerCase() === name.toLowerCase();

          if (root.character && same(root.character.name)) {
            if (root.code_active === true)
              return { accepted: true, action: 'CODE_ALREADY_ACTIVE', name };
            let next;
            try {
              next = new URL(root.location.href);
            } catch {
              return { accepted: false, reason: 'LOCAL_CHARACTER_URL_INVALID' };
            }
            next.searchParams.set('code', slot);
            root.setTimeout(() => root.location.assign(next.toString()), 0);
            return { accepted: true, action: 'RELOAD_LOCAL_CODE', name, slot };
          }

          const frames = Array.from(root.document && root.document.querySelectorAll
            ? root.document.querySelectorAll('iframe') : []);
          const frame = frames.find(candidate => {
            try {
              const declared = candidate && candidate.dataset ? candidate.dataset.name : null;
              const actual = candidate && candidate.contentWindow && candidate.contentWindow.character
                ? candidate.contentWindow.character.name : null;
              return same(actual || declared);
            } catch {
              return false;
            }
          });
          if (!frame || !frame.contentWindow)
            return { accepted: false, reason: 'CHARACTER_RUNNER_NOT_FOUND' };
          try {
            if (frame.contentWindow.code_active === true)
              return { accepted: true, action: 'CODE_ALREADY_ACTIVE', name };
            const href = frame.contentWindow.location && frame.contentWindow.location.href
              ? frame.contentWindow.location.href
              : frame.src;
            const next = new URL(href, root.location.origin);
            next.searchParams.set('no_html', 'true');
            next.searchParams.set('is_bot', '1');
            next.searchParams.set('code', slot);
            root.setTimeout(() => { frame.src = next.toString(); }, 0);
            return { accepted: true, action: 'RELOAD_CHILD_CODE', name, slot };
          } catch (error) {
            return {
              accepted: false,
              reason: String(error && error.message || error || 'CODE_RESTART_FAILED').slice(0, 180)
            };
          }
        })()
        """;
        return template
            .Replace("__ALBOT_NAME_JSON__", n, StringComparison.Ordinal)
            .Replace("__ALBOT_SLOT_JSON__", s, StringComparison.Ordinal);
    }

    private static string BuildStartCharacterExpression(string name, string codeSlot)
    {
        var n = JsonSerializer.Serialize(name);
        var s = JsonSerializer.Serialize(codeSlot);
        return $$"""
        (() => {
          const name = {{n}};
          const slot = {{s}};
          const root = globalThis;
          const fn = typeof root.start_character_runner === 'function'
            ? root.start_character_runner
            : (typeof root.start_character === 'function' ? root.start_character : null);
          if (!fn) return { accepted: false, reason: 'START_CHARACTER_UNAVAILABLE' };
          let active = {};
          try {
            if (typeof root.get_active_characters === 'function')
              active = root.get_active_characters() || {};
          } catch {}
          const state = String(active[name] || '');
          if (['self','starting','loading','active','code'].includes(state))
            return { accepted: true, action: 'ALREADY_ACTIVE', name, state };
          try {
            const result = fn.call(root, name, slot);
            if (result && typeof result.catch === 'function') result.catch(() => {});
            return { accepted: true, action: 'START_CHARACTER', name, slot };
          } catch (error) {
            return { accepted: false, reason: String(error && error.message || error || 'START_FAILED').slice(0, 180) };
          }
        })()
        """;
    }

    private const string InspectExpression = """
    (() => {
      const root = globalThis;
      const rows = root.X && Array.isArray(root.X.characters) ? root.X.characters : [];
      let active = {};
      try {
        if (typeof root.get_active_characters === 'function')
          active = root.get_active_characters() || {};
      } catch {}

      let cache = {};
      try {
        let raw = null;
        if (typeof root.storage_get === 'function') raw = root.storage_get('code_cache');
        else if (root.localStorage) raw = root.localStorage.getItem('code_cache');
        cache = raw ? JSON.parse(raw) : {};
      } catch {}

      const characters = rows.map(row => {
        const id = row && row.id != null ? String(row.id) : '';
        const savedSlot = id && cache && cache['slot_' + id] != null
          ? String(cache['slot_' + id]) : null;
        return {
          name: String(row && row.name || ''),
          ctype: String(row && (row.ctype || row.type) || '').toLowerCase(),
          online: row && row.online === true,
          server: row && row.server != null ? String(row.server) : null,
          codeSlot: savedSlot
        };
      }).filter(row => row.name);

      return {
        characters,
        active,
        localName: root.character && root.character.name ? String(root.character.name) : null,
        localCodeActive: root.code_active === true,
        serverRegion: typeof root.server_region !== 'undefined' ? String(root.server_region || '') : '',
        serverIdentifier: typeof root.server_identifier !== 'undefined' ? String(root.server_identifier || '') : ''
      };
    })()
    """;

    private static IReadOnlyList<string> NormalizeNames(IEnumerable<string>? names) =>
        (names ?? Array.Empty<string>())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(value => value, StringComparer.OrdinalIgnoreCase)
            .ToArray();

    private static bool ReadAccepted(JsonElement value) =>
        value.ValueKind == JsonValueKind.Object
        && value.TryGetProperty("accepted", out var accepted)
        && accepted.ValueKind is JsonValueKind.True;

    private static string? ReadReason(JsonElement value) =>
        value.ValueKind == JsonValueKind.Object ? ReadString(value, "reason") : null;

    private static string? ReadString(JsonElement value, string property) =>
        value.TryGetProperty(property, out var node) && node.ValueKind == JsonValueKind.String
            ? node.GetString()
            : null;

    private static bool ReadBool(JsonElement value, string property) =>
        value.TryGetProperty(property, out var node) && node.ValueKind == JsonValueKind.True;

    private static bool SameOrigin(Uri left, Uri right) =>
        string.Equals(left.Scheme, right.Scheme, StringComparison.OrdinalIgnoreCase)
        && string.Equals(left.Host, right.Host, StringComparison.OrdinalIgnoreCase)
        && left.Port == right.Port;

    private static string Bound(string value) =>
        value.Length <= 240 ? value : value[..240];

    private sealed record LifecycleTarget(string Url, string WebSocketDebuggerUrl);
    private sealed record LifecycleSnapshot(
        IReadOnlyList<CharacterLifecycleRow> Characters,
        IReadOnlyDictionary<string, string> Active,
        string? LocalName,
        bool LocalCodeActive,
        string? ServerRegion,
        string? ServerIdentifier);
}
