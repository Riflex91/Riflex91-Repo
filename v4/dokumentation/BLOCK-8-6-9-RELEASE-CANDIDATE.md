# Block 8.6.9 – gebundener Release-Candidate

Status: **finaler Block-8.6-Candidate technisch gebunden; immutable Deployment/HTTPS, Schatten, kontrolliert live und Soak sind noch offen. Block 9 bleibt gesperrt.**

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
- alle noch offenen operativen Freigabestufen explizit als `false`.

Insbesondere bleiben:

- `deploymentPerformed=false`
- `publicHttpsVerified=false`
- `adventureLandShadowVerified=false`
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

## Was dieser Schritt bewusst nicht behauptet

Dieser Stand bedeutet noch nicht:

- Deployment ausgeführt,
- HTTPS verifiziert,
- realer Schatten bestanden,
- kontrolliert live bestanden,
- Soak bestanden,
- Block 8.6 abgeschlossen,
- Block 9 freigegeben.

## Nächster Schritt

Nach Merge dieser Bindung darf der manuelle Workflow für exakt `ca0dfee7685563c8b6003469300c8fd08777b053` ausgeführt werden. Erst dessen erfolgreicher Run wird anschließend als Deployment-/HTTPS-Evidenz kanonisch in einem separaten Nachweisschritt gebunden.
