# Block 8.6.9 – gebundener Release-Candidate

Status: **finaler Block-8.6-Candidate technisch gebunden, immutable veröffentlicht, öffentlich per HTTPS verifiziert und realer Schatten bestanden; kontrolliert live und Soak sind noch offen. Block 9 bleibt gesperrt.**

## Exakter Candidate

Der freizugebende Candidate ist der letzte vollständig grüne PR-Head aus #407:

- Git-SHA: `ca0dfee7685563c8b6003469300c8fd08777b053`
- durch Merge-Commit `a767c18334cfb20422abea04105bc0cbd40603a5` in `main` aufgenommen
- Candidate-Version: `1.0.0`
- 51 Module
- 396471 Bytes
- SHA-256 `b5d39ac692157ec98c9c77cc7d4afca0b39a0b67abbabbcc31b863a6b0f77ea5`

Der Merge-Commit wird **nicht** als neuer Candidate umgedeutet. Die Release-Bindung bleibt auf dem exakt getesteten PR-Head, auf dem beide Pflicht-CIs gelaufen sind.

## Offline-/Replay-Nachweis

Für exakt `ca0dfee7685563c8b6003469300c8fd08777b053` sind gebunden:

- PR #407
- `v4-ci` Run `35440445689`, Run #383, Job `105890209278`: success
- `v4-grundlage-pruefen` Run `35440445635`, Run #1630, Job `105890209231`: success
- 626/626 Haupttests
- 37/37 zusätzliche Prüfungen
- Namensprüfung bestanden
- Block-8.6.8-Replay/Regression ist Teil dieses geprüften Candidate-Stands

Damit ist die deterministische Offline-/Replay-Grundlage für den Release-Candidate gebunden. Das ist **kein** Ersatz für reale Deployment-, Schatten-, Live- oder Soak-Evidenz.

## Historische Runtime bleibt unverändert

Vor jedem Candidate-Build wird weiterhin Runtime 1.1.5 reproduziert und exakt verlangt:

- 31 Module
- 228607 Bytes
- SHA-256 `95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f`

Eine Abweichung sperrt den Block-8.6-Candidate-Build.

## Manifest

Maschinenlesbar:

`v4/dokumentation/BLOCK-8-6-9-RELEASE-CANDIDATE.json`

Das Manifest bindet:

- exakten Candidate-Git-SHA,
- Merge-Nachweis in `main`,
- Modulzahl, Bytes und SHA-256,
- unveränderte Runtime 1.1.5,
- die erfolgreichen Offline-/Replay-CI-Nachweise,
- den erfolgreichen immutable Deployment-/HTTPS-Nachweis,
- alle noch offenen realen Adventure-Land-Freigabestufen explizit als `false`.

Aktueller Gate-Stand:

- `deploymentPerformed=true`
- `publicHttpsVerified=true`
- `adventureLandShadowVerified=true`
- `adventureLandControlledLiveVerified=false`
- `adventureLandSoakVerified=false`
- `block86Completed=false`
- `block9Freigegeben=false`

## Isolierter manueller Publish-Pfad

Workflow:

`.github/workflows/release-v4-block8-6-candidate.yml`

Er besitzt ausschließlich `workflow_dispatch` und verlangt:

1. Dispatch von `main`,
2. exakt den im Manifest gebundenen `release_sha`,
3. den Bestätigungstext `PUBLISH-V4-BLOCK8-6:<release_sha>`,
4. getrennten Checkout des aktuellen Release-Control-Stands und des exakten Candidate-SHAs,
5. erneuten deterministischen Candidate-Build,
6. exakten Vergleich von Modulzahl, Bytes und SHA-256,
7. unveränderte Runtime-1.1.5-Bindung,
8. immutable R2-Veröffentlichung ohne Überschreiben abweichender vorhandener Bytes,
9. R2-Rückvergleich,
10. öffentlichen HTTPS-Byte-/Hash-/Header-Rückvergleich.

Der Workflow besitzt keine V3-Build-, V3-Release-, Worker-Deploy-, D1- oder Lifecycle-Autorität.

## Öffentlicher Transportname

Der bestehende öffentliche V4-Release-Reader stellt immutable V4-Artefakte unter den bereits etablierten Transportnamen bereit:

- `aio-v4-runtime.js`
- `aio-v4-runtime.sha256`

Deshalb wird das lokale Candidate-Artefakt

`dist/aio-v4-block8-6-candidate.js`

beim Publish **byteidentisch** unter dem öffentlichen Alias `aio-v4-runtime.js` für genau diesen Candidate-SHA abgelegt. Das ändert weder den Candidate-Inhalt noch Runtime 1.1.5 und erfordert keine Änderung am gemeinsam genutzten Dashboard/Worker.

Die semantische Identität bleibt durch Manifest, Git-SHA und SHA-256 eindeutig als Block-8.6-Candidate gebunden.

## Erster manueller Release-Versuch

Der erste manuelle Workflow-Lauf `35441241411` am 19. September 2026 bestaetigte erfolgreich:

- exakten Dispatch-SHA und Bestaetigungstext,
- Release-Control-Manifest,
- Checkout des exakten Candidates,
- reproduzierbaren Candidate-Build,
- unveraenderte Runtime 1.1.5,
- vorhandene Cloudflare-Credentials.

Er stoppte **vor jedem Publish** im Schritt `Prepare isolated R2-only Wrangler config`.

Ursache: Wrangler `4.135.0` akzeptiert bei `r2 bucket info` kein `--remote`. Der im Repository bereits erfolgreich verwendete Produktionspfad nutzt fuer `r2 bucket info` nur `--config`, waehrend `r2 object put/get` weiterhin `--remote` verwenden.

Folge dieses fehlgeschlagenen Versuchs:

- kein Candidate-Objekt publiziert,
- keine R2-Rueckverifikation ausgefuehrt,
- keine HTTPS-Verifikation ausgefuehrt,
- `deploymentPerformed=false` bleibt korrekt,
- `publicHttpsVerified=false` bleibt korrekt.

Der Release-Workflow verwendet deshalb ab dem Korrekturstand die bereits real bestaetigte Wrangler-4.135.0-Syntax: Bucket-Existenzpruefung ohne `--remote`, Object-Put/Get mit `--remote`, ohne unnoetige Experimental-Flags.

## Erfolgreicher immutable Release- und HTTPS-Nachweis

Der erfolgreiche manuelle Workflow-Lauf ist:

- Workflow: `release-v4-block8-6-candidate-immutable`
- Run: `35441831873` / #4
- Job: `105893861206`
- Control-Head auf `main`: `07e2af0f721219b50586b4c5e08cece717048610`
- exakter Candidate: `ca0dfee7685563c8b6003469300c8fd08777b053`
- Ergebnis: **success**
- abgeschlossen: `2026-09-19T12:05:07Z`

Der Lauf hat für exakt denselben Candidate erfolgreich nachgewiesen:

1. exakte Dispatch-Bindung und Bestätigung,
2. Candidate-Manifest und exakten Candidate-Checkout,
3. reproduzierbaren Build mit 51 Modulen / 396471 Bytes,
4. SHA-256 `b5d39ac692157ec98c9c77cc7d4afca0b39a0b67abbabbcc31b863a6b0f77ea5`,
5. unveränderte historische Runtime 1.1.5,
6. immutable Veröffentlichung beider Candidate-Objekte in R2,
7. bytegleichen R2-Rückdownload beider Objekte,
8. öffentlichen HTTPS-Rückdownload über den bestehenden Worker,
9. bytegleichen öffentlichen Candidate,
10. passenden öffentlichen SHA-256,
11. CORS `*`,
12. `Cache-Control: no-store`,
13. passenden JavaScript-/Text-Content-Type,
14. `x-aio-v4-release-sha: ca0dfee7685563c8b6003469300c8fd08777b053`.

Immutable R2-Ziele:

- `aio-v3-logs/releases/v4/ca0dfee7685563c8b6003469300c8fd08777b053/aio-v4-runtime.js`
- `aio-v3-logs/releases/v4/ca0dfee7685563c8b6003469300c8fd08777b053/aio-v4-runtime.sha256`

Öffentliche immutable URLs:

- `https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/ca0dfee7685563c8b6003469300c8fd08777b053/aio-v4-runtime.js`
- `https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/ca0dfee7685563c8b6003469300c8fd08777b053/aio-v4-runtime.sha256`

Der detaillierte kanonische Nachweis steht in:

`BLOCK-8-6-9-CANDIDATE-DEPLOYMENT-NACHWEIS.md`

Damit sind `deploymentPerformed=true` und `publicHttpsVerified=true` technisch belegt. Dieser Nachweis erweitert keine Spielautorität und ersetzt nicht Schatten, kontrolliert live oder Soak.

## Realer Adventure-Land-Schattennachweis

Der reale Schattenlauf wurde mit dem source-locked Block-8.6-Schattenpaket fuer exakt denselben immutable Candidate bestanden.

Kanonische Evidenz:

`BLOCK-8-6-9-SCHATTEN-FREIGABE-NACHWEIS.json`

Gebundener Bericht:

- Quelle: Chat-Paste
- Datei: `Eingefügter Text(20260919-125742).txt`
- 678718 Bytes
- SHA-256 `77f911e5c27bf9c960c66a7cff41ad87f09e30d087af175963e7cb45e9ede217`
- Bericht erstellt: `2026-09-19T12:57:39.627Z`
- Laufkennung: `block8-6-schatten-1789822653521`
- Durchgefuehrt am: `1789822656778`
- Paket-Version: `1.0.0`
- Runner-Version: `1.0.0`

Der Bericht bestaetigt fuer exakt `ca0dfee7685563c8b6003469300c8fd08777b053`:

- Candidate-SHA-256 `b5d39ac692157ec98c9c77cc7d4afca0b39a0b67abbabbcc31b863a6b0f77ea5`
- Candidate-Groesse **396471 Bytes**
- Ergebnis **PASS**
- Runner-Stufe `schatten` mit `pass=true`
- keine Runner-Fehler
- `spielAktionAusgefuehrt=false`
- Runtime 1.1.5 weiterhin `aktivFreigegeben=false`
- CM-Empfang nicht installiert
- Heartbeat-Automatik nicht aktiv
- **0 Heartbeat-Sendeversuche / 0 Erfolge / 0 Fehler**
- Capability-Laufzeit 1.0.0 weiterhin `aktivFreigegeben=false`
- keine Remote-Beobachtung
- kein Capability-Empfang
- **0 Capability-Sendeversuche / 0 Erfolge / 0 Fehler**
- Katalog-Fingerprint `2299d0025c1e85725c2a75601832009aa2b78afa56a9f8a771d17528416c5268`
- lokaler Snapshot- und Capability-Fingerprint `20c2cf00b529b2b6c281a2ca349d14a501d4b49d24353122eeadb547bbd4038d`
- Schattenuebergabe exakt an `git:ca0dfee7685563c8b6003469300c8fd08777b053` gebunden

Die im Bericht sichtbaren `SKILL_NICHT_VALIDIERT`-Diagnosen sind erwartete fail-closed Blockierungen nicht explizit validierter Skills und kein Schattenfehler.

Damit ist `adventureLandShadowVerified=true` technisch belegt. Kontrolliert live und Soak bleiben sequenziell gesperrt.

## Was dieser Schritt bewusst nicht behauptet

Dieser Stand bedeutet noch nicht:

- kontrolliert live bestanden,
- Soak bestanden,
- Block 8.6 abgeschlossen,
- Block 9 freigegeben.

## Nächster Schritt

Deployment, öffentlicher HTTPS-Preflight und realer Adventure-Land-Schatten sind für exakt `ca0dfee7685563c8b6003469300c8fd08777b053` bestanden. Als nächste sequenzielle reale Freigabestufe folgt **kontrolliert live** mit derselben Schattenuebergabe.

Der Soak bleibt bis zum bestandenen kontrollierten Live-Nachweis gesperrt.
