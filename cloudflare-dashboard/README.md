# AiO Bot Dashboard 2.13.0 – Cloudflare Worker + D1 + Workers AI

Das Remote-Dashboard stellt Charakterstatus, Live-Karte und die **lebendig animierte Gehirn-Übersicht** bereit. Der Worker ist zugleich State-Sync-, Teacher- und Brain-Telemetrie-Backend und persistiert außerdem Champion/Challenger-Zustände, Lernqualitäts-/Quarantänestatus sowie das Gehirn-Tagebuch über den Student-State.

## Bindings und Secrets

`wrangler.jsonc` erwartet:

- D1-Binding `DB` für `aio-bot-dashboard`
- Workers-AI-Binding `AI`
- Secret `WRITE_KEY` für Bot-Schreibzugriffe
- Secret `READ_KEY` für Dashboard-Lesezugriffe

`WRITE_KEY` und `READ_KEY` werden nicht in Git committed. Der Bot sendet den Schreibschlüssel im POST-Body; das Dashboard sendet den Leseschlüssel als Header und hält ihn nur im `sessionStorage` des Tabs.

## Bestehende Installation auf 2.13.0 aktualisieren

```bash
cd cloudflare-dashboard
npm install
npx wrangler login
npx wrangler d1 execute aio-bot-dashboard --remote --file=schema.sql
npm run deploy
```

Das Schema verwendet `CREATE TABLE/INDEX IF NOT EXISTS`. Neu für Brain v2 ist insbesondere `brain_learning_events` für Outcome-/Reward-Historie. `aio_state` speichert außerdem Student-Gewichte, eingefrorene Champion-/Rollback-Snapshots und Telemetrie.

## Erstinstallation

```bash
cd cloudflare-dashboard
npm install
npx wrangler login
npx wrangler d1 create aio-bot-dashboard
```

Die ausgegebene `database_id` in `wrangler.jsonc` einsetzen. Danach:

```bash
npx wrangler d1 execute aio-bot-dashboard --remote --file=schema.sql
npx wrangler secret put WRITE_KEY
npx wrangler secret put READ_KEY
npm run deploy
```

Für beide Secrets lange, zufällige und unterschiedliche Werte verwenden.

## Brain v2 API

- `POST /api/brain` – Qwen-Teacher mit serverseitigem Tagesbudget
- `POST /api/brain-feedback` – gemessene Outcome-Rewards sowie Champion/Challenger-Ereignisse (Promotion, Rollback, Reject)
- `POST /api/state` – Config, Lern-/Explorer-Daten und Student-Modell synchronisieren
- `GET /api/brain-status` – zusammengefasste Gehirn-Telemetrie für das Dashboard
- `GET /api/status` – Charakterstatus

Der Worker begrenzt `dailyLimit` hart auf 10.000. Der Bot verwendet standardmäßig ein Ziel von 99,5 % (= 9.950), damit eine kleine Reserve gegen Schätzabweichungen bleibt. Das verwendete Modell ist fest `@cf/qwen/qwen3-30b-a3b-fp8`, weil die Budgetrechnung auf dessen Kostenmodell abgestimmt ist.

## Gehirn-Übersicht

Das Dashboard zeigt Teacher-Verbrauch, Tagesziel und UTC-Reset sowie Student-Samples, Replay, Updates, Confidence, Entropie, Novelty, Loss, Reward, Teacher-Übereinstimmung, Champion/Challenger-Canary, Bewährung, Promotions/Rollbacks, letzte Entscheidungen und Outcome-Rewards. Ein neuronaler Puls vermittelt den aktuellen Aktivitätszustand des Brains, ohne Entscheidungslogik zu ersetzen. Für ein lebendigeres Gefühl bevorzugt `/api/brain-status` den Brain-Zustand aus den häufigeren Charakter-Status-Pushes; die vollständigen Gewichte bleiben weiterhin nur im State-Sync.

Die vollständigen Gewichtsmatrizen werden nicht an die Dashboard-Ansicht ausgeliefert; `/api/brain-status` gibt nur die zusammengefasste Student-Telemetrie zurück.

### Lernqualität / Selbstkontrolle

2.13.0 zeigt zusätzlich den vom Bot berechneten Lernqualitätszustand. `/api/brain-status` liefert dafür ausschließlich eine bereinigte Zusammenfassung: Status/Score, aktuelle und historische Reward-/Confidence-Werte, Overconfidence-Fehlerquote, Reward-Instabilität, Loss-Drift, Sicherheitsvorfälle, Teacher-Verstärkung, Lernraten-Skalierung, Autonomie-/Canary-Gates sowie den letzten gesunden Champion-Snapshot als Generationsnummer.

Die eigentliche Qualitätslogik läuft im Merchant und benötigt keine neue D1-Tabelle. Der vollständige Qualitätszustand wird als Teil des bestehenden `student:<character>`-State synchronisiert; neuronale Gewichtsmatrizen werden vom Dashboard-Endpunkt nicht ausgegeben. Der Qualitätswächter erzeugt auch keine eigenen Workers-AI-Anfragen, sondern passt nur die vorhandene Teacher-Kadenz innerhalb des bestehenden Tagesbudgets an.

### Gehirn-Tagebuch

Das Tagebuch benötigt **keine zusätzliche D1-Tabelle**: Es wird als begrenzter Bestandteil des vorhandenen `student:<character>`-State gespeichert. `/api/brain-status` gibt daraus nur bereinigte Einträge (Zeit, Typ, Ton, Titel, Detail, Aktion/Ziel, Reward, Generation und Quelle) zurück. Die Webansicht bevorzugt für die jüngsten Einträge den Live-Status und fällt für die längere Historie auf den D1-Student-State zurück. Dadurch entstehen keine zusätzlichen Workers-AI-Kosten.

## Bot verbinden

Im Bot unter **Web-Dashboard** die Worker-HTTPS-Basis-URL und den `WRITE_KEY` eintragen. Das Dashboard selbst fragt beim Öffnen nach dem `READ_KEY`.

Für Headless/caracAL:

```text
AIO_DASHBOARD_URL=https://aio-bot-dashboard.<dein-subdomain>.workers.dev
AIO_DASHBOARD_WRITE_KEY=<WRITE_KEY>
```
