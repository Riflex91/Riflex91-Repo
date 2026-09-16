# Adventure Land AiO Bot v4

V4 is a clean-room successor to v1-v3. It does not copy the v3 runtime and it does not replace v3 while the foundation is being built.

The design goal is a bot that can run 24/7, explain every important decision, reproduce failures from recorded evidence, learn only inside explicit safety boundaries, and produce development work from real runtime incidents without giving the live bot unrestricted code authority.

## Non-negotiable principles

1. One runtime kernel owns scheduling, time, intents and resource ownership.
2. Feature modules request actions through intents; they do not call Adventure Land APIs directly.
3. Safety outranks optimization and learning.
4. The world model records provenance: observed, inferred and learned facts stay distinguishable.
5. Replayability is a first-class requirement, not a later debugging feature.
6. Runtime telemetry is structured and traceable; text logs are a presentation layer only.
7. The live Adventure Land runtime never receives SFTP/FTP credentials.
8. The web dashboard uses HTTPS/API access. SFTP is only an archive transport on the server side.
9. Automated development may prepare branches, tests and pull requests, but gameplay/safety/economy changes are not self-merged by the bot.
10. V3 remains isolated until V4 passes the final acceptance campaign in `docs/ROADMAP.md`.

## Repository layout

```text
v4/
├── runtime/                 # code that can execute in Adventure Land
│   ├── src/
│   │   ├── contracts/       # stable types shared by runtime subsystems
│   │   ├── kernel/          # event bus, intent arbitration, resource ownership
│   │   ├── game/            # the only Adventure Land API boundary
│   │   ├── world/           # snapshots, evidence and knowledge
│   │   ├── planning/        # strategy/planning, no direct execution
│   │   ├── safety/          # hard safety gates
│   │   ├── execution/       # validated action execution
│   │   ├── telemetry/       # structured events and traces
│   │   ├── replay/          # deterministic recording/replay primitives
│   │   ├── learning/        # bounded learning/experiments
│   │   └── features/        # farmer, party, merchant and economy behaviors
│   └── test/
├── platform/
│   ├── api/                 # HTTPS backend/control plane
│   ├── dashboard/           # web UI
│   ├── archive-sync/        # server-side SFTP archive bridge
│   └── development-agent/   # incident/replay -> development queue -> PR preparation
├── schemas/                 # machine-readable event/incident/archive contracts
├── fixtures/                # deterministic replay and test fixtures
├── infra/                   # server/deployment preparation
├── scripts/                 # build/verification tools
└── docs/                    # architecture, roadmap, ADRs and test strategy
```

## Foundation commands

```bash
cd v4
npm install
npm run check
```

The foundation intentionally contains no Farmer/Merchant gameplay implementation yet. The first milestone is to make the infrastructure that future gameplay code cannot bypass.
