# Block 8.6.9 – Freigabevorbereitung und Capability-Candidate

Status: **Candidate-Pfad und alle operativen Freigabestufen Offline → Schatten → kontrolliert live → Soak sind fuer denselben immutable Candidate bestanden und kanonisch gebunden. Block 8.6 ist abgeschlossen; Block 9 ist freigegeben.**

## Ziel

Block 8.6.9 ueberfuehrt die in 8.6.1 bis 8.6.8 entwickelte Capability-Truth-Schicht in denselben sequenziellen Freigabeprozess wie Block 8.5:

1. deterministische Offline-/Replay-Abnahme,
2. realer Schattenbetrieb ohne neue Spielaktion,
3. begrenzter kontrollierter Live-Test,
4. Soak mit Telemetrie und Recovery-Nachweis.

Alle vier Stufen muessen fuer **denselben exakten Candidate-Aenderungsstand** bestanden sein.

## Historische Runtime 1.1.5 bleibt immutable

Der bestandene Block-8.5-Candidate bleibt unveraendert:

- 31 Module,
- 228607 Bytes,
- SHA-256 `95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f`.

Block 8.6.9 veraendert weder diesen Build noch dessen Entry.

Der neue Block-8.6-Candidate wird separat gebaut und enthaelt:

- die unveraenderte Produktionsruntime 1.1.5,
- die neue Capability-Freigabelaufzeit,
- den Block-8.6-Candidate-Entry.

Damit kann die neue Capability-Schicht gemeinsam mit der bewaehrten Block-8-Liveness getestet werden, ohne den historischen 1.1.5-Nachweis umzuschreiben.

## Candidate-Builder

Builder:

`v4/werkzeuge/block8-6-candidate-bauen.mjs`

Ausgabe bei explizitem Build:

- `dist/aio-v4-block8-6-candidate.js`,
- `dist/aio-v4-block8-6-candidate.sha256`.

CI-/Pruefmodus:

`npm run block8-6-candidate:pruefen`

Der Builder:

1. baut zuerst die historische Produktionsruntime 1.1.5 read-only nach,
2. verlangt exakt 31 Module / 228607 Bytes / bekannten SHA-256,
3. kompiliert die aktuelle V4-Quelle in einem temporaeren CommonJS-Baum,
4. sammelt nur den Modulgraph des neuen Block-8.6-Candidate-Entries,
5. erzeugt ein deterministisches Standalone-Bundle,
6. gibt Modulzahl, Bytegroesse und SHA-256 aus.

Eine Veraenderung des historischen 1.1.5-Builds blockiert den 8.6-Candidate-Build sofort.

## Candidate-Entry

Entry:

`v4/laufzeit/quelle/ausfuehrung/adventure-land-block8-6-candidate-einstieg.ts`

Globale APIs nach Laden:

- `V4ProduktionsLaufzeit` – unveraenderte Runtime 1.1.5,
- `V4CapabilityLaufzeit` – Capability-Freigabelaufzeit 1.0.0,
- `V4Block86Candidate` – read-only Candidate-Fassade 1.0.0.

Das Bundle startet keine Runtime automatisch.

Konfiguration erfolgt getrennt ueber:

- `AIO_V4_RUNTIME_CONFIG`,
- `AIO_V4_CAPABILITY_CONFIG`.

## Capability-Freigabelaufzeit

Quelle:

`v4/laufzeit/quelle/ausfuehrung/adventure-land-capability-freigabe.ts`

Vertrag:

`v4/laufzeit/quelle/vertraege/capability-freigabe.ts`

Die Laufzeit kombiniert ausschließlich vorhandene 8.6-Bausteine:

- Skill-Katalog-Audit,
- SkillPolicy,
- technische Skill-Readiness,
- CharakterFaehigkeiten,
- Capability-Snapshot,
- Remote-Vertrauen,
- capability-basierte Gruppenwahl,
- CapabilityStatus.

Sie besitzt selbst:

- `spielAutoritaet=false`,
- `neustartAutoritaet=false`.

## Test-Policy ist isoliert

Der Candidate akzeptiert explizite `policyVorgaben`.

Diese werden in einem **isolierten In-Memory-Speicher** angewendet.

Dadurch kann der Freigabetest beispielsweise zwei Ranger mit unterschiedlichen `3shot`-/`5shot`-Vorgaben pruefen, ohne:

- produktive Browser-Persistenz zu veraendern,
- historische Nutzerkonfiguration umzuschreiben,
- neue Skills implizit zu aktivieren.

Alle normalen SkillPolicy-Grenzen gelten weiterhin.

## Wiederverwendung der bestehenden Liveness

8.6.9 startet **kein zweites Heartbeat-Protokoll**.

Der passive Beobachter:

`AdventureLandAkzeptierterLebensnachweisBeobachter`

wird erst nach aktivem Block-8-CM-Empfang installiert.

Ablauf bei eingehendem Heartbeat:

1. zuerst wird der bereits vorhandene Block-8-`on_cm`-Handler aufgerufen,
2. nur wenn dieser exakt `true` zurueckgibt, darf die Capability-Schicht die Roh-Evidenz mitlesen,
3. die Nachricht wird nicht neu gesendet,
4. es existiert kein eigener Liveness-Timer,
5. die bestehende Produktionsruntime bleibt Liveness-Autoritaet.

Damit bleibt die 8.6.5-Regel erhalten:

> Capability-Vertrauen benoetigt bestehende Block-8-Liveness; Capability-Daten erzeugen keine eigene Freshness-Autoritaet.

## Schatten

Im Schatten gilt gleichzeitig:

- `AIO_V4_RUNTIME_CONFIG.aktivFreigegeben=false`,
- `AIO_V4_CAPABILITY_CONFIG.aktivFreigegeben=false`,
- Produktionsruntime nicht gestartet,
- kein installierter Capability-Remote-Empfang,
- kein Capability-CM-Sendeversuch,
- kein Produktionsheartbeat-Sendeversuch.

Erlaubt ist nur:

`V4CapabilityLaufzeit.aktualisiere()`

Damit werden reale Live-Daten gelesen und Katalog/Readiness/Policy/Capability/Diagnose berechnet.

PASS verlangt mindestens:

- Skill-Katalog produktionsbereit,
- lokalen Capability-Snapshot,
- 0 Heartbeat-Sendeversuche,
- 0 Capability-Sendeversuche,
- keine Spielautoritaet.

## Kontrolliert live

Kontrolliert live darf erst beginnen, wenn:

- ein bestandener Schattennachweis fuer denselben Aenderungsstand vorliegt,
- Runtime 1.1.5 aktiv ist,
- Block-8-CM-Empfang installiert ist,
- Produktionsheartbeat aktiv ist,
- mindestens ein Heartbeat erfolgreich bestaetigt wurde,
- keine Heartbeat-Sendefehler vorliegen,
- Capability-Laufzeit explizit aktiv freigegeben wurde.

Danach darf die Capability-Laufzeit:

1. die bereits akzeptierten Block-8-Heartbeats passiv beobachten,
2. Capability-CM-Empfang installieren,
3. pro explizit vertrautem anderem Charakter **genau einen** Capability-Snapshot senden.

Es existiert keine automatische Capability-Sende-Schleife.

Der API-Bestaetigungstext lautet pro Ziel:

`BLOCK8-6-CAPABILITY-SENDEN:<Zielname>`

Der Freigaberunner besitzt zusaetzlich die Lauf-Bestaetigung:

`BLOCK8-6-KONTROLLIERT-LIVE:<laufKennung>`

Der Live-Nachweis setzt konservativ:

- `spielAktionAusgefuehrt=true`,
- `begrenzt=true`.

Der Grund ist die reale `send_cm(...)`-Nutzung durch Produktionsheartbeat und Capability-One-Shot.

## Remote-Vertrauen

Ein empfangener Capability-Snapshot wird weiterhin nur ueber den echten 8.6.5-Pfad vertraut.

Dazu benoetigt er gleichzeitig:

- Capability-Snapshot,
- vom bestehenden Block-8-Handler akzeptierten Heartbeat,
- exakt passende Charakterkennung und Name,
- exakt passende Heartbeat-`gesendetAm`-/`laufendeNummer`-Bindung,
- aktive Block-8-Teilnehmerbewertung,
- gleichen vorbereiteten Katalog-Fingerprint.

Fehlt eine dieser Bedingungen, bleibt der Remote-Teilnehmer fail-closed.

## Soak

Runner:

`v4/werkzeuge/block8-6-freigabestufen-live-test.js`

Standarddauer:

**600000 ms = 10 Minuten**

Standardsampling:

**5000 ms**

Der Soak veraendert die Capability-Laufzeit nicht.

Pro Sample werden mindestens geprueft:

- Katalog weiterhin produktionsbereit,
- Katalog-Fingerprint unveraendert,
- lokaler Capability-Snapshot verfuegbar,
- Capability-Sendefehlerzahl unveraendert,
- Produktionsheartbeat-Sendefehlerzahl unveraendert.

Am Ende muss zusaetzlich:

- die Mindest-Samplingdichte erreicht sein,
- der Produktionsheartbeat neue Erfolge bestaetigt haben.

## Recovery-Nachweis

Der 8.6-Soak erfindet keinen Recovery-Erfolg.

`recoveryNachweis=true` darf nur gesetzt werden, wenn zusaetzlich der deterministische 8.6.8-Replay-Nachweis fuer **denselben Candidate-Aenderungsstand** als verifiziert gebunden ist.

Der reale Soak bestaetigt damit:

- stabile Live-Telemetrie,
- keine neue Drift/Sende-Fehler,

waehrend 8.6.8 reproduzierbar die eigentliche Sequenz

`Connection-Gap → Recovery → explizite Revalidierung`

abdeckt.

## Freigaberunner

Globale API:

`V4Block86FreigabeLiveTest`

Version:

`1.0.0`

Modi:

- `schatten`,
- `live`,
- `soak`.

Der Runner ruft nicht direkt auf:

- `attack()`,
- `move()`,
- `smart_move()`,
- `use_skill()`,
- Trankfunktionen,
- `loot()`,
- `send_cm()`,
- Party-/Handels-/Upgrade-Aktionen.

Er startet oder stoppt die Produktionsruntime ebenfalls nicht selbst.

## Git-/Release-Bindung

Dieser Vorbereitungs-PR legt nur den Candidate-Code fest.

Nach seinem Merge wird ein separater Manifest-/Release-Schritt erstellt.

Das Manifest bindet dann exakt:

- den final gruenen Candidate-Git-SHA,
- Candidate-Modulzahl,
- Candidate-Bytegroesse,
- Candidate-SHA-256,
- bestandene Offline-/Replay-Evidenz.

Dadurch muss kein Commit seinen eigenen SHA enthalten.

Erst danach darf ein manueller immutable Publish fuer diesen exakten Candidate erfolgen.

## Vollstaendiger Freigabestand

Fuer exakt denselben Candidate sind inzwischen sequenziell kanonisch bestanden:

- finaler Candidate-Manifest-/Offline-Replay-Nachweis,
- immutable Deployment und oeffentliche HTTPS-Verifikation,
- realer Schattenlauf,
- bidirektionaler kontrollierter Live-Lauf,
- bidirektionaler 10-Minuten-Soak.

Der Soak-Nachweis steht in `BLOCK-8-6-9-SOAK-FREIGABE-NACHWEIS.json`. Damit gelten `adventureLandSoakVerified=true`, `block86Completed=true` und `block9Freigegeben=true`.

## Abnahme dieses Vorbereitungsstands

CI muss mindestens pruefen:

1. historische Runtime 1.1.5 bleibt exakt unveraendert,
2. Block-8.6-Candidate baut reproduzierbar,
3. Candidate enthaelt Runtime + Capability-API,
4. Schatten bleibt bei 0 CM-/Heartbeat-Sendungen,
5. Schatten kann Remote-Beobachtung/Senden nicht aktivieren,
6. Live-Beobachtung verlangt bereits aktive Block-8-Liveness,
7. passiver Heartbeat-Beobachter laesst den bestehenden Handler zuerst entscheiden,
8. kontrolliertes Capability-Senden verlangt explizite Bestaetigung,
9. kontrolliertes Senden ist One-Shot statt Timer,
10. Runner besitzt keine direkte Adventure-Land-Spielaktionsfunktion,
11. Runner startet/stoppt die Produktionsruntime nicht selbst,
12. Soak ist auf mindestens 10 Minuten begrenzt,
13. Soak-Recovery braucht gebundene 8.6.8-Replay-Evidenz.

## Source-locked Schattenpaket

Fuer den realen Adventure-Land-Schattenlauf ist jetzt ein einzelnes Copy/Paste-Paket vorbereitet:

`v4/werkzeuge/block8-6-schatten-paket.js`

Es ist hart gebunden an:

- Candidate `ca0dfee7685563c8b6003469300c8fd08777b053`
- 396471 Bytes
- SHA-256 `b5d39ac692157ec98c9c77cc7d4afca0b39a0b67abbabbcc31b863a6b0f77ea5`
- immutable HTTPS-URL `https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/ca0dfee7685563c8b6003469300c8fd08777b053/aio-v4-runtime.js`

Das Paket prueft Download, Bytegroesse, Marker und SHA-256, laesst Runtime und Capability-Schicht deaktiviert und gibt erst nach einem strikten Null-Sende-Preflight den einzigen Button **1 · Schattennachweis** frei.

Der reale Schattennachweis bleibt bis zu einem tatsaechlichen Adventure-Land-PASS-Bericht offen.

## Source-locked kontrolliertes Livepaket

Nach dem real bestandenen Schattenlauf steht jetzt ein einzelnes Copy/Paste-Paket fuer die naechste sequenzielle Stufe bereit:

`v4/werkzeuge/block8-6-live-paket.js`

Es bindet exakt:

- Candidate `ca0dfee7685563c8b6003469300c8fd08777b053`
- SHA-256 `b5d39ac692157ec98c9c77cc7d4afca0b39a0b67abbabbcc31b863a6b0f77ea5`
- Schattenlauf `block8-6-schatten-1789822653521`
- die kanonische `schattenUebergabe`
- Vertrauensnamen `My_Ranger1` und `My_Ranger2`
- Bestaetigung `BLOCK8-6-KONTROLLIERT-LIVE:block8-6-schatten-1789822653521`

Der Live-Knopf bleibt bis zu einem bestaetigten fehlerfreien Produktionsheartbeat und sendefreier Capability-Basis gesperrt. Danach ist genau ein Capability-One-Shot an den anderen Ranger moeglich. Soak wird in diesem Paket nicht freigegeben.

Der reale kontrollierte Live-Nachweis ist inzwischen bidirektional bestanden und in `BLOCK-8-6-9-LIVE-FREIGABE-NACHWEIS.json` kanonisch gebunden. Der anschliessende Soak wurde auf beiden Rangern gegen genau diese gebundene Live-Uebergabe ausgefuehrt.

## Source-locked 10-Minuten-Soakpaket

Nach dem real bestandenen bidirektionalen Controlled-Live-Nachweis steht die letzte reale Block-8.6-Stufe bereit:

`v4/werkzeuge/block8-6-soak-paket.js`

Das Paket bindet exakt Candidate, Schattennachweis und beide Live-Report-Hashes. Es laeuft **600000 ms** mit **5000 ms** Sampling.

Zur Schliessung der noch offenen Empfangsbeobachtung soll das Paket auf `My_Ranger1` und `My_Ranger2` parallel laufen. PASS verlangt zusaetzlich mindestens einen neu beobachteten akzeptierten Remote-Heartbeat pro Sitzung. Es erzeugt selbst keine neuen Capability-Sendungen.

Der reale Soak ist mit zwei tatsaechlichen PASS-Berichten bestanden und in `BLOCK-8-6-9-SOAK-FREIGABE-NACHWEIS.json` kanonisch gebunden. Beide Sitzungen liefen 600000 ms mit je 120 Samples, beobachteten jeweils mindestens einen neuen akzeptierten Remote-Heartbeat, erzeugten 0 Capability-Sendungen und bestaetigten Recovery-Replay ohne Heartbeat- oder Capability-Sendefehler.

## Naechster operativer Schritt

Block 8.6 ist nach dem kanonisch gebundenen Soak vollstaendig abgeschlossen. Der naechste Entwicklungsblock ist **Block 9** gemaess dem bestehenden V4-Fahrplan.

Die Freigabe von Block 9 erweitert keine bestehende Spielautoritaet rueckwirkend; neue Block-9-Autoritaet muss weiterhin ueber ihre eigenen Safety-, Replay- und Freigabegrenzen eingefuehrt werden.
