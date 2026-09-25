# V5 Live Lab

Experimental live-runtime workspace derived from official V5 at:

`a240cdb63679f36d92b7eb5583831e159fe2a3f5`

Current integrated browser runtime:

`v5-live-lab/browser/v5-live-lab-bot-v2.js`

Current runtime version/build:

- `0.4.0`
- `V5_LIVE_LAB_PR28_R4_LIVE_EVIDENCE_1`
- branch `chatgpt/v5-live-lab-pr28-r4`

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

- explicit start acknowledgement;
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

The v0.4.0 runtime mounts an in-game HUD automatically when the runner is loaded.

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

## 30-second current-situation file

Live Lab v0.4.0 can maintain one continuously updated file for later analysis:

`D:\\v5-Test\\V5-Live-Situation.md`

Because normal browser JavaScript is not allowed to silently write to an arbitrary Windows folder, the directory must be authorized once from a user gesture.

1. Create `D:\\v5-Test` in Windows if it does not already exist.
2. Load the Live Lab runner.
3. In the in-game HUD press **LOG-ORDNER**.
4. In the Windows folder picker select exactly `D:\\v5-Test`.
5. Grant write access.

The bot immediately creates/updates:

`V5-Live-Situation.md`

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

`D:\\v5-Test\\V5-Live-Situation.md`

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
