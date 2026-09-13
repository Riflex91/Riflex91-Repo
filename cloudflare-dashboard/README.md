# AiO Bot v3 Control Center – Cloudflare Worker + D1 + Workers AI

Dieses Verzeichnis ist ab v3 die gemeinsame Web-Verwaltungszentrale für den Adventure-Land-Bot. Die alte v2-Dashboard-Installation kann damit überschrieben werden.

## Funktionen

- Live-Übersicht aller Bot-Charaktere
- Party-/Combat-/Kiting-Telemetrie
- Merchant Home-Service, Economy, Gear und Marktstatus
- vollständige gruppierte Control-Plane-Einstellungen
- Safety-Locks für nicht abschaltbare Invarianten
- 🧠 Brain-Ansicht für 32→24→5 Student, Teacher, Replay, Outcomes und Champion/Challenger
- Gehirn-Tagebuch
- zusammengeführte Runtime-Events
- D1-Datenbankübersicht
- versionierte Settings mit Revision/Audit-Trail

## Cloudflare Bindings und Secrets

`wrangler.jsonc` erwartet:

- D1-Binding `DB` auf `aio-bot-dashboard`
- Workers-AI-Binding `AI`
- `WRITE_KEY` – ausschließlich Bot → Worker
- `READ_KEY` – Dashboard-Lesezugriff
- `ADMIN_KEY` – Dashboard-Settings ändern

Alle drei Secrets müssen unterschiedlich sein und werden **nicht** committed oder in D1 synchronisiert.

```bash
cd cloudflare-dashboard
npm install
npx wrangler login
npx wrangler d1 execute aio-bot-dashboard --remote --file=schema.sql
npx wrangler secret put WRITE_KEY
npx wrangler secret put READ_KEY
npx wrangler secret put ADMIN_KEY
npm run deploy
```

Bei einer neuen D1-Datenbank zuerst:

```bash
npx wrangler d1 create aio-bot-dashboard
```

Danach die ausgegebene `database_id` in `wrangler.jsonc` eintragen. Das Repository enthält absichtlich keinen echten D1-Identifier und keine Secrets.

## v3 API

Bot-Endpunkte, geschützt durch `WRITE_KEY` im JSON-Body:

- `POST /api/v3/runtime` – kompakter Runtime-/Combat-/Economy-/Brain-Snapshot + aktuelle Events
- `POST /api/v3/sync` – Settings abrufen und Brain-State zwischen Tabs/Geräten synchronisieren
- `POST /api/v3/brain/teacher` – budgetierter Qwen-Teacher
- `POST /api/v3/brain/feedback` – gemessene Outcome-Rewards

Dashboard-Endpunkte, geschützt durch `X-AIO-Read-Key`:

- `GET /api/v3/overview`
- `GET /api/v3/settings`
- `GET /api/v3/brain`
- `GET /api/v3/events`

Settings schreiben:

- `PATCH /api/v3/settings`
- benötigt zusätzlich `X-AIO-Admin-Key`
- verwendet `expectedRevision`, damit parallele Änderungen nicht still überschrieben werden

`GET /api/health` benötigt keinen Schlüssel und zeigt nur Bindings-/Service-Status, niemals Secret-Werte.

## Brain v2 in v3

Das v3-Brain übernimmt die bewährten Ideen aus v2, ist aber an die v3-Safety-Architektur angepasst:

- 32 normalisierte Zustandsinputs
- 24 Hidden-Neuronen
- 5 strategische Ausgänge: `continue`, `change_farm_target`, `replan_merchant`, `explore`, `wait`
- Teacher-Distillation über Cloudflare Workers AI
- Experience Replay
- reale Outcome-Rewards
- Quality Watcher
- eingefrorener Champion / lernender Challenger
- Promotion und Rollback anhand Validierungs-Loss und realer Rewards
- persistentes lokales Brain-State + D1-Sync

Das Brain hat absichtlich **keinen direkten Executor-Zugriff**. Kampf, Retreat, Dangerous-Content, Transaktionen und `command_character`-Autorität bleiben deterministisch und lokal gesichert.

Workers AI verwendet aktuell fest `@cf/qwen/qwen3-30b-a3b-fp8`. Die serverseitige Tagesgrenze ist auf maximal 10.000 Neurons begrenzt; Standardziel ist 99,5 %, sodass eine kleine Reserve verbleibt.

## D1-Langzeitgedächtnis

Neu hinzu kommen unter anderem:

- `v3_runtime_status`
- `v3_control_settings`
- `v3_control_audit`
- `v3_brain_state`
- `v3_runtime_events`
- `v3_market_snapshots`

Die bestehenden `brain_usage`, `brain_decisions` und `brain_learning_events` werden weiterverwendet. Alte v2-Tabellen bleiben im Schema erhalten, damit eine vorhandene D1-Datenbank in-place migriert werden kann.

## Bot einmalig verbinden

Nach Deployment auf jedem Bot-Tab einmal die Worker-Basis-URL und denselben `WRITE_KEY` konfigurieren. Die Daten bleiben lokal im Browser und werden nicht in Status oder D1 ausgegeben:

```js
AIO_V3.__runtime.alpha25ControlCenterBrain.configureCloud({
  baseUrl: 'https://aio-bot-dashboard.<subdomain>.workers.dev',
  writeKey: '<WRITE_KEY>',
  account: 'default'
});
```

Danach übernimmt die Control Plane den regelmäßigen Sync. Nur der Merchant nutzt den Workers-AI-Teacher; alle Charaktere können Runtime-Telemetrie synchronisieren.

Alternativ kann vor dem Bot-Start gesetzt werden:

```js
globalThis.AIO_V3_CLOUD_CONFIG = {
  baseUrl: 'https://aio-bot-dashboard.<subdomain>.workers.dev',
  writeKey: '<WRITE_KEY>',
  account: 'default'
};
```

## Lokale Datenquellen

Das Cloud-D1 ersetzt die lokalen v3-Stores nicht. Das Brain kann weiterhin aus World Model, Knowledge Aging, Party Performance, Character Registry, Inventory Ledger, Gear Progression, Market History, Performance Tracker und Event-/Flight-Recorder lernen. D1 ist die gemeinsame Langzeit-/Control-Plane-Ebene darüber.
