# V5 Live Lab

Experimental live-runtime workspace derived from official V5 at:

`aa779a0fe1321a68c89ad9ae0eec02108904e978`

Current integrated browser runtime:

`v5-live-lab/browser/v5-live-lab-bot-v2.js`

Current runtime version/build:

- `0.6.4`
- `V5_LIVE_LAB_FULL_AUTONOMY_R13_1`
- branch `chatgpt/v5-live-lab-movement-postcondition-r13`

Live Lab is intentionally isolated from the official V5 verification track. The official `main:v5/` roadmap, historical evidence, dependency gates and step-by-step automated tests remain authoritative and are not modified by Live Lab operation.

## Purpose

Live Lab runs the future integrated V5 behavior early in real Adventure Land gameplay. Its purpose is to expose long-running, cross-feature and integration faults that isolated step tests may not reveal.

Observed faults should be exported with:

```js
V5LiveLab.exportBugBundle()
```

and recorded using the **V5 Live-Test Bug** issue schema.

## Authority boundary

When Live Lab is running and its live admission checks pass:

- `liveExecutionAllowed = true`
- `gameplayAuthority = true`
- `normalRuntimeAllowed = true`

Direct/raw transport authority intentionally remains closed:

- `rawWriteAuthority = false`

All gameplay mutations go through public Adventure Land functions or the bounded V5 Live Lab ports. The runtime does not use `socket.emit(...)` or `api_call(...)` as a mutation bypass.

## Verification-only / Windows-Bridge isolation (v0.6.4)

This Live Lab build exists only to validate bot functionality early and shorten the official V5 development/test loop.

It deliberately has **no communication path to the Windows Bridge app**. The browser runtime contains no Windows-Bridge/CDP client, no HTTP `fetch` transport, no WebSocket transport, no `XMLHttpRequest`, no `EventSource`, no `BroadcastChannel`, no Supabase telemetry client and no external-host command channel.

Runtime status exposes the contract explicitly:

- `verificationOnly = true`
- `windowsBridgeCommunication = false`
- `externalHostTransport = false`
- `bridgeIsolation.transportPolicy = ADVENTURE_LAND_PUBLIC_FUNCTIONS_ONLY`

Allowed runtime channels are limited to:

- Adventure Land public gameplay functions;
- Adventure Land `send_cm` for in-game character coordination;
- browser-local `localStorage` / IndexedDB for bounded local state;
- the user-authorized File System Access API for the optional local situation file.

The optional `V5-Live-Situation-<Character>.md` writer is direct browser-to-file I/O after the user chooses a directory. It is not sent through the Windows Bridge and is not uploaded externally by Live Lab.

CI includes a bridge-isolation guard that fails if Windows-Bridge/CDP/host-network transport markers are later introduced into `v5-live-lab-bot-v2.js`.

## Full local autonomy (v0.6.4)

In the local AL 2.5D loopback sandbox, Live Lab now defaults to a full-decision mode.

On load it can start automatically without a separate manual `configure()` step and sets:

- `fullDecisionAuthority = true`
- `farm.enabled = true`
- `merchant.enabled = true`
- automatic farm-target discovery;
- automatic roaming toward a known monster spawn when no target is currently visible;
- automatic party-heartbeat discovery from the live Adventure Land party;
- automatic group topology selection when live peers are available;
- autonomous Merchant fallback decisions for potion restocking and low-free-slot bank servicing;
- automatic capability evidence collection.

The optimizer therefore no longer requires a manually supplied monster list before it can create a normal farm task. It ranks live known monsters using bounded level/HP/attack/distance risk inputs and can create a search task when the selected monster type is known from the current map but no instance is visible yet.

The Merchant is no longer treated as a failed solo DPS topology. Its local group requirement is empty and it runs Merchant service logic instead of combat logic.

### Local auto-start scope

Automatic start is restricted to the detected AL 2.5D **loopback** environment. A direct/non-local Adventure Land runtime still requires the explicit start acknowledgement.

The emergency stop, runtime-conflict check, AL25D upstream compatibility check, stale-target validation, irreversible intent fencing, unknown-result no-retry behavior, movement anti-thrash and other fail-closed checks remain enabled.

### Authority boundary

"Full autonomy" means the bot may choose and execute all gameplay decisions exposed through its existing Adventure Land public-function boundary. It still deliberately does **not** introduce a raw `socket.emit(...)` or `api_call(...)` mutation bypass, so `rawWriteAuthority` remains `false`.

## Implemented live stages

### PR24 — Group runtime

The live runtime now includes:

- bounded party/peer truth from local state plus V5 Live Lab heartbeats;
- session/roster freshness;
- lifecycle/death handling;
- class capability calculation;
- topology requirements;
- deterministic role assignment;
- one character may provide multiple capabilities, e.g. Priest = HEAL + REVIVE;
- TANK, HEAL, SINGLE_TARGET, AOE, CC, KITE and REVIVE capability handling;
- heal support;
- revive support;
- tank/aggro response;
- optional CC;
- shared-cooldown observation;
- MP shortage observation;
- disconnect/rejoin observation;
- foreign-party-member detection;
- map-instance drift detection;
- missing-member detection;
- equipment-drift observation;
- capability-loss detection;
- movement-thrash prevention;
- fail-closed group blocker handling.

### PR25 — Group live evidence

The runtime records real live segments:

- `CAPABILITY_5M` — minimum 300 seconds;
- `INTEGRATION_15M` — minimum 900 seconds.

Tracked metrics include:

- unexpected gameplay writes;
- duplicate irreversible effects;
- safety violations;
- stale-target actions;
- movement-thrash events;
- unresolved recovery;
- deaths;
- disconnect/rejoin failures;
- kill rate;
- XP per minute.

Live Lab evidence is useful live evidence, but it does **not** silently ratify the official V5 gate.

### PR26 — Task / Party optimizer

PR26 now participates in real runtime selection.

The optimizer:

1. builds task candidates;
2. expands them across concrete live party profiles;
3. applies hard safety/capability/world-freshness filters first;
4. rejects unsafe combinations before ranking;
5. ranks only eligible Task × Party combinations;
6. binds the selected task to the selected party members;
7. prevents a local character from executing a task when it is not in the selected party.

Learning contribution is bounded and can never relax a hard filter.

### PR27 — Account progression

PR27 now participates in real task allocation.

The runtime maintains bounded per-character training time and combines it with:

- level progress;
- gear progress;
- survival state;
- role requirements;
- prior training share.

Optional farming/quest work is biased toward the selected progression character. A stronger local character can therefore deliberately idle instead of consuming optional training that should go to a weaker character.

Mandatory group roles remain protected and are not sacrificed merely to balance progression. Urgent group/world work can still preempt optional progression work.

### PR28 — World autonomy

The runtime supports:

- Event live-state observation from `S` / `parent.S`;
- Quest live-state observation from configured `character.s` or `character.q` paths;
- Rare/Boss discovery from current live entities;
- unknown-content discovery quarantine;
- server registry/config observations;
- server hopping;
- PvP/Hardcore opt-in policy;
- world-state TTL/freshness;
- definition/live-state separation;
- deterministic world-task candidates;
- bounded world plan ledger;
- immediate pre-action revalidation;
- event/quest drift blocking;
- one-shot world-action dedupe;
- server-hop cooldown;
- no automatic promotion of unknown content.

World plan states include `PLANNED`, `ACTION_READY`, `TRANSPORTING`, `ACTIVE_CONTINUOUS`, `COMPLETED`, `UNKNOWN` and `BLOCKED`.

A failed Event/Quest/World revalidation blocks the downstream gameplay action. The Farmer path is not allowed to continue on a stale world plan.

## Safety that remains enabled

Live Lab intentionally keeps the following safety boundaries active:

- explicit start acknowledgement outside the local AL25D full-autonomy auto-start path;
- emergency stop;
- V3/V4 concurrent-runtime detection;
- stale session/roster detection;
- hard capability filters;
- target revalidation;
- movement anti-thrash;
- AoE hard caps;
- Merchant anti-pingpong;
- irreversible intent IDs;
- no automatic retry after an ambiguous irreversible result;
- unknown-content quarantine;
- event/quest fingerprint revalidation;
- server-mode policy;
- server-hop cooldown;
- bounded logs and world plans.

An irreversible public call that throws after dispatch is classified as `UNKNOWN`. The same intent ID is not blindly resent.

## In-game GUI

The v0.6.4 runtime mounts an in-game HUD automatically when the runner is loaded.

The HUD provides:

- **START** — starts Live Lab with the required acknowledgement automatically;
- **STOP** — stops the runtime normally;
- **NOTHALT** — immediately stops live execution and marks the runtime emergency-stopped;
- **FEHLER MELDEN** — builds a structured V5 Live-Test Bug report and copies it to the clipboard;
- current runtime/authority state;
- current task and target;
- selected PR26 party and party members;
- selected PR27 progression character;
- PR24 group status, roles, faults and blockers;
- PR28 world plan/quarantine/hop counters;
- Merchant service/free inventory state;
- PR25 evidence status;
- latest important runtime event;
- build/version/tick/log metadata.

The HUD can be collapsed with the minus/plus button.

### Fehler melden

Pressing **FEHLER MELDEN** copies a Markdown report designed for the agreed **V5 Live-Test Bug** schema.

The copied report includes:

- suggested issue title;
- placeholders for the short human symptom description;
- profile, runtime version, build ID, branch and source-main SHA;
- runtime session ID, start time and uptime;
- character, class, map and server;
- live authority state;
- current task, target and PR26 party;
- PR24 group topology, roles, faults and blockers;
- PR25 evidence summary;
- PR27 progression choice;
- PR28 world autonomy counters;
- Merchant/inventory state;
- unclassified severity plus suggested area labels for triage;
- the last 250 log records;
- the full bounded `V5LiveLab.exportBugBundle()` JSON;
- initial occurrence-history metadata.

After pressing the button, paste the clipboard contents into the ChatGPT bug-inbox chat and add one short sentence describing what you observed. The technical context is already included.

The same report can be generated manually with:

```js
V5LiveLab.buildBugReportText()
```

or copied programmatically with:

```js
await V5LiveLab.copyBugReportToClipboard()
```

The GUI can be remounted or removed manually:

```js
V5LiveLab.mountGui()
V5LiveLab.unmountGui()
```

## Per-character situation files (v0.6.4)

Each running character writes to its own file in the selected situation directory. The filename is derived from the live Adventure Land character name and sanitized for Windows filenames.

Examples:

```text
V5-Live-Situation-test1.md
V5-Live-Situation-test2.md
V5-Live-Situation-test3.md
V5-Live-Situation-test4.md
```

This prevents multiple characters using the same selected folder from overwriting each other's evidence. The directory permission remains shared/browser-local; only the output filename is character-specific.

## Semantic movement verification (v0.6.4)

Live Lab no longer treats a resolved `smart_move(...)` call as proof that the character arrived or even moved.

For every movement it captures the pre-call map/coordinates and verifies a semantic postcondition after the public call resolves. It records:

- `WORLD_ARRIVAL_POSTCONDITION_CONFIRMED` when a coordinate destination is actually reached or a named monster becomes visible;
- `WORLD_MOVE_PROGRESS_CONFIRMED` when map/position/moving state proves real progress;
- `WORLD_MOVE_NO_PROGRESS` when the public call returned but the live character state did not move.

The capability ledger records this separately as `internal:movement_postcondition`, so a call-level `smart_move` success can no longer be mistaken for semantic movement proof.

For autonomous monster search, a named destination with no semantic progress is cooled down for 15 seconds. The bot can then try another known monster type instead of repeatedly issuing the same no-op move.

Situation reports now include a **Live Monster Diagnostics** section with the live visible-monster count and nearest monster entities. This distinguishes movement/pathing bugs from a local server that is not exposing/spawning monsters.

## Browser fallback when direct folder access is unavailable (v0.6.4)

If `typeof window.showDirectoryPicker === "undefined"`, normal browser JavaScript cannot be granted arbitrary write access to `D:\\v5-Test` from that context. Live Lab therefore stays bridge-free and falls back automatically:

- every character refreshes its own situation snapshot every 30 seconds in browser-local storage;
- **SITUATION KOPIEREN** copies the complete current Markdown snapshot;
- **SITUATION DOWNLOAD** downloads `V5-Live-Situation-<Character>.md` when normal browser downloads are allowed;
- **LOG-ORDNER** remains optional and only uses direct File System Access when the browser actually exposes it.

The missing folder API no longer blocks the bot and no Windows Bridge is required.

## 30-second current-situation file

Live Lab v0.6.4 can maintain one continuously updated file for later analysis:

`D:\\v5-Test\\V5-Live-Situation-<Character>.md`

Because normal browser JavaScript is not allowed to silently write to an arbitrary Windows folder, the directory must be authorized once from a user gesture.

1. Create `D:\\v5-Test` in Windows if it does not already exist.
2. Load the Live Lab runner.
3. In the in-game HUD press **LOG-ORDNER**.
4. In the Windows folder picker select exactly `D:\\v5-Test`.
5. Grant write access.

The bot immediately creates/updates:

`V5-Live-Situation-<Character>.md`

and then overwrites that same file every **30 seconds**. No growing sequence of snapshot files is created.

When the browser supports persistent File System Access handles, Live Lab stores the selected directory handle in IndexedDB. On a later reload it attempts to restore the handle and resume the 30-second writer automatically. If the browser asks for permission again, press **LOG-ORDNER** once more.

The HUD shows whether the situation writer is active, its selected directory, and the last successful update.

### Capability evidence inside the situation file

Every public Adventure Land action sent through the Live Lab execution boundary is accumulated in a persistent capability ledger. Examples include:

- `attack`
- `use_skill`
- `smart_move`
- `loot`
- `respawn`
- `send_cm`
- `change_server`
- `buy` / `sell`
- `exchange`
- `upgrade`
- `compound`
- `craft`
- `send_item`
- `send_gold`
- `bank_store` / `bank_retrieve` / `bank_swap`

Live Lab also records internal target-selection evidence separately as `internal:target_selection`.

For each observed capability the situation file contains:

- total attempts;
- confirmed successful calls;
- ordinary failures;
- ambiguous/UNKNOWN irreversible outcomes;
- first/last success timestamps;
- action kinds;
- sessions;
- characters;
- maps;
- servers;
- distinct execution contexts;
- current evidence state.

Evidence states are:

- `NOT_OBSERVED`
- `OBSERVED_LIVE_SUCCESS`
- `REPEATED_LIVE_CALL_SUCCESS`
- `STRONG_LIVE_CALL_EVIDENCE`
- `MIXED_RESULTS`
- `REVALIDATION_REQUIRED`

`STRONG_LIVE_CALL_EVIDENCE` currently requires at least 20 successful calls, at least two runtime sessions, at least two distinct contexts, zero recorded failures and zero UNKNOWN outcomes.

Important: this is deliberately classified as **call-level live evidence**. A resolved Adventure Land function call is strong evidence that the execution adapter works, but it is not automatically treated as proof of every semantic postcondition. Therefore the official V5 test track may use the file to reduce redundant repetition and focus on smoke/regression/integration checks, but the Live Lab does not silently ratify official V5 gates.

The file also contains the current PR24-28 state, selected task/party/progression character, group faults/blockers, PR25 evidence, World/Merchant state, the full capability ledger JSON, current runtime status JSON, and the last 200 runtime log entries.

For analysis, send the current file:

`D:\\v5-Test\\V5-Live-Situation-<Character>.md`

instead of collecting many separate log snippets.

The same snapshot can be produced manually with:

```js
V5LiveLab.buildSituationFileText()
```

Force an immediate overwrite with:

```js
await V5LiveLab.writeSituationFileNow()
```

Check the writer with:

```js
V5LiveLab.situationWriterStatus()
```

## Local Adventure Land 2.5D compatibility

Live Lab v0.6.4 is compatible with the local **AL 2.5D** client architecture used by
`chatgpt/al-2.5d-local-sandbox-v7`.

That client deliberately keeps the pinned original Adventure Land gameplay runtime authoritative
and renders the new 2.5D presentation above it. In embedded mode the original client runs in a
same-origin iframe marked:

```html
iframe[data-al25d-legacy-runtime="true"]
```

V5 Live Lab therefore separates its surfaces:

- **gameplay state and actions** come from the original legacy Adventure Land window;
- **HUD, clipboard, localStorage/IndexedDB and LOG-ORDNER** use the visible AL 2.5D host window.

The bot never sends gameplay actions to the Pixi 2.5D renderer itself.

### Supported runtime layouts

The same browser runner automatically detects these layouts:

- `ADVENTURE_LAND_DIRECT` — normal/direct Adventure Land runtime;
- `AL25D_ATTACHED` — 2.5D renderer attached in the original Adventure Land window;
- `AL25D_HOST_TO_LEGACY_IFRAME` — runner loaded in the visible 2.5D host and gameplay routed into the embedded legacy iframe;
- `AL25D_LEGACY_FRAME` — runner executing directly in the legacy game frame;
- `AL25D_CODE_RUNNER_TO_LEGACY` — original Adventure Land CODE runner nested below the legacy game frame inside the 2.5D host.

The final layout is important for the local sandbox because the original Adventure Land CODE
mechanism may execute user code in its own runner frame. Live Lab walks only readable same-origin
ancestors, locates the visible AL 2.5D host, and locates the authoritative gameplay window
separately.

Inspect the detected environment with:

```js
V5LiveLab.runtimeEnvironment()
```

or:

```js
V5LiveLab.status().runtimeEnvironment
```

### Routed Adventure Land surfaces

In AL 2.5D mode the following are read from the legacy gameplay window:

- `character`
- `entities`
- `G`
- `S`
- `server_region` / `server_identifier`
- party/player queries
- `on_cm`
- all public gameplay functions used by the Live Lab, including attack, skills, movement,
  loot, respawn, Merchant/economy actions, transfers, bank operations and server changes.

The existing public-function safety boundary remains in force. AL 2.5D compatibility does **not**
introduce a raw `socket.emit(...)` or `api_call(...)` bypass.

If the legacy iframe is recreated or reloaded, the next Live Lab tick resolves the new
`contentWindow`, removes its CM handler from the old window, installs it on the new legacy
runtime and continues against the fresh authoritative state.

### Upstream compatibility pin

The current AL 2.5D compatibility layer is based on the pinned original Adventure Land client:

`ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4`

If a local AL 2.5D runtime explicitly advertises a different
`__AL25D_UPSTREAM_COMMIT__`, Live Lab refuses to start. An unadvertised commit remains accepted
because the current local client does not require that global to be present.

### Local sandbox workflow

Start the AL 2.5D sandbox as documented by the client:

```powershell
cd "AL 2.5d"
npm run local:start
```

The visible client opens at:

`http://127.0.0.1:5173/?localAdmin=1&legacy=/legacy/`

Create/select the character through the original Adventure Land UI. Load the Live Lab runner
through the normal CODE workflow or into the visible host. Then verify:

```js
V5LiveLab.runtimeEnvironment()
V5LiveLab.inspectPorts()
```

For an embedded local run, `character` and the gameplay ports must resolve from the legacy
runtime while the Live Lab HUD stays visible over the 2.5D client.

The 30-second `D:\\v5-Test\\V5-Live-Situation-<Character>.md` writer continues to work in this mode.
Its browser file picker, clipboard and persistent directory handle are intentionally taken from
the visible AL 2.5D host rather than the hidden legacy client.

## Loading and starting the browser runtime

Load:

`v5-live-lab/browser/v5-live-lab-bot-v2.js`

The runtime installs as:

```js
V5LiveLab
```

Inspect available Adventure Land public functions:

```js
V5LiveLab.inspectPorts()
```

Configure while the runtime is stopped, then start it explicitly:

```js
V5LiveLab.configure({
  coordination: {
    peers: ["My_Priest", "My_Warrior"],
    assistLeader: "My_Warrior"
  },

  group: {
    enabled: true,
    topologyId: "tank-heal-aoe",
    leader: "My_Warrior",
    knownMemberIds: ["My_Warrior", "My_Priest", "My_Mage"],
    failClosedOnFault: true,
    roleSkills: {
      heal: "heal",
      taunt: "taunt",
      agitate: "agitate",
      revive: "revive",
      cc: "stomp"
    }
  },

  farm: {
    enabled: true,
    monsters: ["goo"],
    loot: true,
    respawn: true,
    aoeEnabled: true,
    aoeMinTargets: 2,
    aoeMaxTargets: 6,
    skills: [
      {
        name: "burst",
        aoe: true,
        targeted: false,
        minMp: 100
      }
    ]
  },

  optimizer: {
    replanMs: 1000,
    partyProfiles: [
      {
        id: "full-party",
        memberIds: ["My_Warrior", "My_Priest", "My_Mage"]
      },
      {
        id: "warrior-priest",
        memberIds: ["My_Warrior", "My_Priest"],
        resourceCost: 5
      }
    ]
  },

  progression: {
    enabled: true,
    targetCorridor: 0.08,
    mandatoryRoles: ["TANK", "HEAL"]
  },

  world: {
    events: [
      {
        id: "goobrawl",
        stateKey: "goobrawl",
        priority: 80,
        action: {
          type: "PUBLIC_FUNCTION",
          name: "join",
          args: ["goobrawl"]
        }
      }
    ],

    quests: [
      {
        id: "my-quest",
        source: "s",
        stateKey: "myquest",
        priority: 70,
        destination: {
          map: "main",
          x: 0,
          y: 0
        },
        action: {
          type: "MOVE",
          destination: {
            map: "main",
            x: 0,
            y: 0
          },
          arrivalRadius: 40
        }
      }
    ],

    rareMonsters: ["phoenix"],

    discoveryEnabled: true,

    allowedPublicActions: ["join"],

    serverHopEnabled: false,
    allowPvp: false,
    allowHardcore: false,
    servers: [
      {
        region: "EU",
        identifier: "II",
        mode: "NORMAL",
        online: true
      }
    ]
  }
});

V5LiveLab.start({
  ack: "V5_LIVE_LAB_START"
});
```

The example values are configuration examples only. Monster, skill, event, quest and character names should be set to the actual account/test scenario.

## World action types

Configured Event/Quest/World definitions may use these bounded actions:

### Move

```js
{
  type: "MOVE",
  destination: { map: "main", x: 100, y: 200 },
  arrivalRadius: 40
}
```

### Farm monsters

```js
{
  type: "FARM_MONSTERS",
  monsterNames: ["goo"]
}
```

### Skill

```js
{
  type: "USE_SKILL",
  skill: "some_skill",
  targetName: "SomeCharacter",
  once: true
}
```

### Allowlisted public Adventure Land function

```js
{
  type: "PUBLIC_FUNCTION",
  name: "join",
  args: ["goobrawl"],
  once: true
}
```

A public function is executable only when its name is also present in `world.allowedPublicActions`.

### Server hop

Server-hop tasks are generated from `world.servers`. Target mode must be known, the target must be online/fresh, PvP/Hardcore policy must allow it, and the cooldown must permit the hop.

## Operations

Status:

```js
V5LiveLab.status()
```

Normal stop:

```js
V5LiveLab.stop("MANUAL_STOP")
```

Emergency stop:

```js
V5LiveLab.emergencyStop("MANUAL_EMERGENCY_STOP")
```

Export logs:

```js
V5LiveLab.exportLogs()
```

Export the complete Live-Test Bug bundle:

```js
V5LiveLab.exportBugBundle()
```

The bug bundle includes build identity, source-main SHA, current character/server state, full Live Lab configuration, current PR24-28 runtime state and bounded logs.

## Restart / recovery behavior

The browser runtime stores a bounded safety state in `localStorage` per character.

Persisted safety state includes:

- irreversible intent fences;
- server-hop cooldown history;
- bounded per-character training time;
- whether the prior Live Lab session ended while still marked running.

If a prior session disappeared while an irreversible action was `IN_FLIGHT`, the next runtime converts that record to `UNKNOWN` with `RESTART_DURING_IRREVERSIBLE_ACTION`. The same intent is not automatically resent.

A detected unclean restart also injects the PR24 `RESTART` fault. With group fail-closed behavior enabled, the first reconciliating group tick remains blocked. After reconciliation, a subsequent fresh tick may return to `LIVE_GROUP_READY`.

World action plans themselves are not blindly resumed across a code/browser restart. Fresh observations and a new pre-action revalidation are required.

## Isolation rules

1. Live Lab code stays on the dedicated Live Lab branch.
2. Live Lab authority does not change official V5 gates.
3. Historical V5 evidence is never rewritten by Live Lab.
4. A successful Live Lab run does not automatically ratify PR21-PR28.
5. Official fixes learned from Live Lab must still pass the official step-by-step verification track.
6. Every Live-Test Bug should include the Live Lab build/commit and exported bug bundle when possible.
7. `rawWriteAuthority` remains false.
8. If the Live Lab branch becomes stale relative to `main`, no further writes are made to that stale branch; work moves to a fresh branch derived from current `main`.
