# Block 8.5 – formaler V3 -> V4 Wissenstransfer

Status: **dokumentarisch abgeschlossen am 19. September 2026; alle fuer Block 8.5 relevanten V3-Prinzipien sind umgesetzt oder einem spaeteren V4-Block zugeordnet.**

## Zweck

V3 enthaelt viele im echten Betrieb entstandene Zuverlaessigkeits-, Telemetrie-, Recovery- und Betriebslektionen. Block 8.5 uebernimmt diese Erfahrungen **nicht als unkontrollierte Codekopie**, sondern als explizite, pruefbare V4-Vertraege und Freigabepfade.

Das Ziel ist:

- bewaehrte V3-Erkenntnisse nicht erneut zu verlieren,
- V4 trotzdem architektonisch sauber und deterministisch zu halten,
- keine alten Hotfix-Ketten oder impliziten Autoritaeten mitzuschleppen,
- jede Uebernahme mit einem V4-Test und einer eindeutigen Sicherheitsgrenze zu verbinden.

## Verbindliche Transferregel

Jeder V3->V4-Transfer braucht vor Implementierung vier Angaben:

1. **V3-Beleg** – konkrete Quelle, Test oder Produktionsproblem,
2. **uebernommene Erkenntnis** – welches Verhalten oder welche Invariante bewaehrt ist,
3. **V4-Ziel** – welcher Vertrag oder welches Modul die Erkenntnis aufnimmt,
4. **Abnahme** – welcher deterministische, Schatten- oder Live-Nachweis die Uebernahme bestaetigt.

Nicht zulaessig ist:

- V3-Dateien ungeprueft nach V4 zu kopieren,
- V3-Hotfix-Reihenfolgen als V4-Architektur zu uebernehmen,
- neue Adventure-Land-Spielaktionen ausserhalb `v4/laufzeit/quelle/ausfuehrung/` einzufuehren,
- V3-Klassen-/Rollenannahmen als V4-Gruppenlogik zu uebernehmen,
- automatische Neustart- oder Update-Autoritaet stillschweigend in die Spiellaufzeit zu legen,
- spaetere Block-9/10/11/14-Fachlogik in Block 8.5 vorzuziehen.

## Bereits vorhandene V4-Basis

Block 8.5 baut auf vorhandenen V4-Bausteinen auf und ersetzt sie nicht:

- `BotEreignis` und `EreignisZentrale`
- `EntscheidungsSpurEintrag` und `AktionsSpurEintrag`
- `Flugschreiber`
- `TelemetrieSpeicher`
- `VorfallErkennung` und `VorfallPaketSammler`
- `BotMeldung`
- `BedienSicherung`
- zentrale `AktionsSteuerung`
- deterministische Wiederholungsdaten
- Block-8-Gruppenkoordination und Produktionsruntime

V4 hat damit bereits die richtige Daten- und Sicherheitsbasis. Der Wissenstransfer soll Luecken fuellen, nicht parallele Systeme bauen.

# Transferinventar

## A. Runtime-Watchdog und Fortschrittsbeobachtung – **jetzt uebernehmen**

### V3-Beleg

- `v3/src/ops/runtime-watchdog.js`
- beobachtet Snapshot-Alter, Heartbeat-Alter, erwartete Aktivitaet und Gruppen-Liveness
- unterscheidet `HEALTHY`, `WATCH` und `DEGRADED`
- gibt eine Recovery-Empfehlung aus, fuehrt aber selbst keinen Neustart aus
- meldet `automaticRecovery: false`

### Uebernommene Erkenntnis

Liveness darf nicht nur an "Prozess laeuft" oder verstrichener Zeit festgemacht werden. Es muessen getrennt betrachtet werden:

- Datenfreshness,
- Heartbeat-Freshness,
- fachlicher Fortschritt,
- Gruppen-Liveness.

Ein Stillstand ist ein beobachtbarer Zustand mit Grund und naechstem sicheren Schritt.

### V4-Ziel

Kein zweiter V3-Watchdog. Stattdessen:

- vorhandene `AblaufBeobachtung` erweitern bzw. konsequent nutzen,
- `VorfallErkennung` fuer Stillstand/Timeout/unerwarteten Wechsel verwenden,
- einen einheitlichen read-only Laufzeit-Gesundheitsstatus fuer HUD und spaetere Host-Ueberwachung ableiten.

### Abnahme

- synthetische stale Snapshot-/Heartbeat-Faelle,
- erwartete Aktivitaet ohne Fortschritt,
- degradierte Gruppen-Liveness,
- kein automatischer Neustart aus der V4-Spiellaufzeit.

## B. Safe-Recovery-Stufen – **jetzt als Verhalten uebernehmen**

### V3-Beleg

- `v3/src/ops/safe-recovery-coordinator.js`
- stufenweise Reaktion auf Watchdog-Zustaende
- sichere Autoritaeten werden vor eskalierenden Recovery-Schritten deaktiviert
- ein Host-Restart wird nur als Plan ausgegeben
- `automaticRestart: false`
- `PROCESS_RESTART_REQUIRES_EXTERNAL_SUPERVISOR`

### Uebernommene Erkenntnis

Recovery braucht explizite Eskalationsstufen. Die Spiellaufzeit darf nicht aus einem unklaren Zustand heraus "irgendwie weiterarbeiten".

### V4-Ziel

Ein versionierter V4-`RecoveryZustand` mit mindestens:

- `normal`
- `beobachten`
- `sicher_pausiert`
- `neustart_empfohlen`
- `blockiert`

Die Laufzeit darf lokal sicher pausieren/abbrechen. Prozess-/Browser-/Host-Neustart bleibt externe Autoritaet.

### Abnahme

- Reconnect,
- stale Daten,
- Fortschrittsstillstand,
- unterbrochene Aktion,
- Neustart waehrend Arbeit,
- kein Recovery-Pfad umgeht `BedienSicherung`, `AktionsSteuerung` oder Safety.

## C. Zuverlaessigkeits-Checkpoint – **jetzt als Vertrag uebernehmen**

### V3-Beleg

- `v3/src/ops/reliability-checkpoint.js`
- versionierte Checkpoints
- Checksumme ueber serialisierten Inhalt
- Quota-/Speicherdruck wird explizit blockiert statt still Daten zu verlieren
- Status ist read-only auswertbar

### Uebernommene Erkenntnis

Ein Recovery-Checkpoint ist nur wertvoll, wenn:

- Version und Integritaet pruefbar sind,
- unvollstaendige oder beschaedigte Daten nicht als gueltig gelten,
- Speicherknappheit sichtbar ist,
- ein Neustart keine halbfertige Arbeit als erfolgreich interpretiert.

### V4-Ziel

Block 8.5 definiert nur den generischen Recovery-/Laufzeit-Checkpoint-Vertrag. Bank-, Handel- oder Wirtschaftstransaktionen folgen erst in Block 9/10.

### Abnahme

- gueltiger Checkpoint,
- falsche Version,
- falscher Hash,
- abgeschnittener Inhalt,
- Quota-Druck,
- Neustart mit offenem Ablauf -> sicher pausiert/blockiert statt "erfolgreich".

## D. Telemetrie-Outbox – **Prinzip jetzt uebernehmen**

### V3-Beleg

- `v3/src/ops/telemetry-outbox.js`
- begrenzte sequenzierte Ausgabe
- explizite ACK-Sequenz
- ungueltige ACKs werden abgewiesen
- Status der Warteschlange ist beobachtbar

### Uebernommene Erkenntnis

Telemetrie darf bei kurzzeitigen Plattform-/Netzfehlern nicht:

- die Spiellogik blockieren,
- unbegrenzt wachsen,
- stillschweigend doppelt gesendet werden,
- ohne bestaetigten Fortschritt geloescht werden.

### V4-Ziel

An die bereits vorhandenen V4-Telemetriegrenzen anbinden. Kein externer Anbieter wird in Block 8.5 fest verdrahtet.

### Abnahme

- begrenzte lokale Queue,
- monotone Sequenz,
- ACK nur bis vorhandene Sequenz,
- Retry ohne Duplikat,
- volle Queue beeintraechtigt nicht die lokale Safety.

## E. Host-Watchdog-Beacon – **Statusvertrag jetzt vorbereiten**

### V3-Beleg

- `v3/src/ops/host-watchdog-beacon.js`
- fasst Runtime-, Watchdog-, Gruppen- und Recovery-Zustand read-only zusammen
- explizit: `hostOwnsRestart: true`
- explizit: verpasste Deadline muss vom Host als ungesund behandelt werden

### Uebernommene Erkenntnis

Fuer 24/7-Betrieb braucht der externe Supervisor eine kleine, stabile, read-only Gesundheitsansicht. Der Host darf ueber Neustart entscheiden; Browser-/Game-Code darf keine generische Host-Autoritaet bekommen.

### V4-Ziel

Gemeinsame StatusSchnittstelle aus Block 8.5 so definieren, dass spaeter ein Host- oder Web-Controller sie lesen kann, ohne neue Spielautoritaet zu erhalten.

### Abnahme

- Status enthaelt Runtime-Freshness, Gruppenstatus, Recovery-Stufe und letzten Fortschritt,
- Ausfall der Anzeige oder des Lesers beeinflusst die Spiellogik nicht,
- keine Restart-Funktion in der read-only Schnittstelle.

## F. Runtime-Lifecycle-Vertrag – **jetzt uebernehmen**

### V3-Beleg

- `v3/src/composition/runtime-lifecycle.js`
- explizite Pflichtmethoden statt impliziter Objektannahmen

### Uebernommene Erkenntnis

Start, Stop, Pause, Fortsetzen, Status und Recovery duerfen nicht als zufaellige Methoden verschiedener Module auseinanderlaufen.

### V4-Ziel

Eine kleine gemeinsame LaufzeitSchnittstelle fuer bereits vorhandene V4-Runtime-Module. Sie beschreibt nur Lifecycle/Status, keine Fachstrategie.

### Abnahme

- fehlende Pflichtmethode blockiert Installation,
- Stop ist idempotent,
- Pause/Fortsetzen ist zustandsklar,
- Status bleibt read-only,
- HUD-Ausfall veraendert Lifecycle nicht.

## G. Party-Telemetrie – **nur Erkenntnisse uebernehmen, Protokoll nicht kopieren**

### V3-Beleg

- `v3/src/party/telemetry-bridge.js`
- trusted names,
- TTL/Freshness,
- Weitergabe fremder `on_cm`-Nachrichten,
- strukturierter Status fuer Leistung, Versorgung und Safety.

### Uebernommene Erkenntnis

Verteilte Charakterdaten brauchen:

- Vertrauensgrenze,
- explizites Protokoll,
- Freshness,
- Weitergabe fremder Nachrichten,
- getrennte fachliche und diagnostische Daten.

### V4-Ziel

**Kein zweites Gruppenprotokoll.** Block 8 besitzt bereits den V4-Gruppen-Lebensnachweis. Block 8.5 erweitert nur dessen beobachtbaren Status fuer Diagnose/HUD.

### Abnahme

- keine neue `send_cm`-Nebenstrecke,
- vorhandener Block-8-Heartbeat bleibt alleinige Gruppen-Liveness-Quelle,
- Diagnose darf keine Rollen-/Fachentscheidung veraendern.

## H. Performance-Messung – **teilweise jetzt, Optimierung spaeter**

### V3-Beleg

- `v3/src/telemetry/performance-tracker.js`
- XP/Gold/Kills/Deaths/Potions/Schaden pro Zeitraum
- Mindestbeobachtungsdauer vor Bewertung

### Uebernommene Erkenntnis

Leistung muss zeitbezogen und von Safety/Recovery getrennt messbar sein. Einzelne kurze Samples duerfen keine Strategieaenderung ausloesen.

### V4-Ziel

Block 8.5 sorgt dafuer, dass vorhandene LeistungsZaehler sauber mit Entscheidung/Aktion/Recovery korrelierbar sind. Strategieoptimierung bleibt Block 11.

### Abnahme

- gleiche Rohzaehler ergeben gleiche Zusammenfassung,
- unvollstaendige Zeitabdeckung wird nicht als Nullleistung ausgegeben,
- keine Leistungsmetrik darf Safety lockern.

# Nachtraeglich priorisierte V3-Erkenntnisse fuer folgende V4-Bloecke

Diese Punkte wurden am 19. September 2026 nach den neuen V3-Arbeiten erneut bewertet. Sie werden **nicht** in den laufenden Block-8.5-Candidate eingebaut. Die Uebernahme beginnt erst nach bestandenem Block-8.5-Soak.

## I. Live Skill Catalog + SkillPolicy – **Block 8.6**

### V3-Beleg

- PR #364
- `v3/src/autonomy/skill-catalog-service.js`
- `v3/src/autonomy/skill-policy.js`
- `v3/src/autonomy/character-combat-profile.js`

### Uebernommene Erkenntnis

Die Gruppenlogik darf nicht nur grobe Rollenwerte kennen. Sie braucht eine live validierte, drift-sichere Wahrheit ueber konkrete Skills, technische Readiness und Nutzerfreigabe.

### V4-Ziel

`BLOCK-8-6-PLAN.md` mit Skill-Katalog, Fingerprint, Revalidation, per-character Policy und skill-spezifischen Slidern.

### Abnahme

Unbekannte Skills fail-closed, Drift/Revalidation, Checkbox-Hard-Block, Slider-Grenzen und reproduzierbare Capability-Ableitung.

## J. Cross-Client Capability Sync – **Block 8.6**

### V3-Beleg

- PR #375
- `v3/src/autonomy/capability-sync.js`

### Uebernommene Erkenntnis

Remote-Capabilities sind nur dann sicher nutzbar, wenn Senderidentitaet, Freshness, lokaler/remote Katalogzustand und Catalog-Fingerprint zusammenpassen.

### V4-Ziel

Den bestehenden Block-8-Lebensnachweis um einen bounded Capability-Snapshot erweitern. Kein zweites Gruppen-Liveness-Protokoll.

### Abnahme

Missing/Stale/Fingerprint-Mismatch fail-closed; gleiche Klassen bleiben pro Charakter getrennt.

## K. Encounter Lifecycle Outcomes – **Block 10.5 und Block 11**

### V3-Beleg

- PR #377
- `v3/src/autonomy/encounter-lifecycle.js`

### Uebernommene Erkenntnis

Lernen braucht abgeschlossene, klar attribuierte Begegnungen statt nur lose Zeitfenster. Erfolg, sicherer Abbruch, Tod, Unterbrechung, Content Drift und Gruppenfehler muessen mit den tatsaechlichen Kosten/Ertraegen des Encounters verbunden werden.

### V4-Ziel

Generischer `BegegnungsDatensatz` in Block 10.5; Encounter-Outcomes werden in Block 11 primaere Lernquelle neben EntscheidungsDatensaetzen.

### Abnahme

Ein Encounter besitzt eindeutigen Lifecycle und genau einen finalen Outcome; Restart/Disconnect darf keinen Erfolg erfinden.

## L. Deterministischer Smart AoE Planner – **Block 10.5**

### V3-Beleg

- PR #371
- `v3/src/autonomy/smart-aoe-planner.js`
- `v3/src/autonomy/tactical-party-combat.js`

### Uebernommene Erkenntnis

Mehrzielkampf braucht eine explizite State Machine und eine harte Capacity, die aus echten Capabilities und Safety entsteht. Nutzerpraeferenzen duerfen nur innerhalb dieser Grenze wirken.

### V4-Ziel

Deterministischer Encounter-/AoE-Planer mit Leader-only Pull-Erweiterung, Follower-Mirror und fail-closed Content-/Capability-Grenzen.

### Abnahme

Single Target bleibt Capacity 1; AoE preferred kann Hard Safety nicht erhoehen; Follower koennen Pulls nicht erweitern.

## M. Bounded Adaptive Pull Learning – **Block 11**

### V3-Beleg

- PR #374
- `v3/src/autonomy/adaptive-pull-learning.js`

### Uebernommene Erkenntnis

Lernen darf innerhalb einer deterministischen Safety-Huelle optimieren, aber diese niemals vergroessern. Risiko darf die Pull-Groesse reduzieren; unbekannte hoehere Groesse nur kontrolliert als +1-Probe.

### V4-Ziel

Versionierte Lernprofile aus Encounter-Outcomes, Mindest-Samples/-Zeit/-Confidence, Probe-Cooldown, sofortiger Abbruch bei Risiko sowie Champion/Challenger/Rollback.

### Abnahme

Keine gelernte Empfehlung kann die Hard Capacity ueberschreiten; unbekannter/quarantined Content ist nicht lern- oder probegeeignet.

## N. Zuverlaessige Remote-ACK-Dienstnachrichten – **Block 9**

### V3-Beleg

- offener PR #211
- stabile Message-IDs, Remote Receive/ACK, bounded Retry/Backoff, Duplicate-Suppression und Negative-ACK.

### Uebernommene Erkenntnis

Ein erfolgreicher `send_cm`-Transportversuch ist nicht gleichbedeutend mit fachlich bestaetigter Verarbeitung auf dem Zielcharakter.

### V4-Ziel

Zustandsveraendernde Merchant-/Bank-Dienstauftraege erhalten vor ihrer Fachlogik ein idempotentes, ACK-faehiges Dienstnachrichtenprotokoll auf dem bestehenden vertrauensgebundenen Kommunikationspfad.

### Abnahme

Verlorene Zustellung, verlorenes ACK, Duplikat und Negative-ACK; keine doppelte fachliche Aktion.

## O. 24/7-Feldzertifizierung und Evidenzkonsistenz – **Block 14 / finale Freigabe**

### V3-Beleg

- gemergter PR #274 mit Canary -> 1h -> 24h -> 72h -> 7d und hashverketteter Evidenz,
- offener PR #287 fuer die reale Windows-Feldzertifizierung.

Beim Review wurde ausserdem eine reale Statusabweichung sichtbar: PR #274 ist mit Merge `216a564bbf034c6f23a701c53ecb3aacedf31410` abgeschlossen, waehrend `v3/architecture-run.json` auf dem geprueften Main-Stand Step 13 noch als `in_progress` fuehrte. V4 soll solche widerspruechlichen Roadmap-/Freigabestaende maschinell erkennen.

### Uebernommene Erkenntnis

CI oder verstrichene Zeit allein zertifizieren keinen 24/7-Betrieb. Dauer-Gates brauchen lueckenlose, integritaetsgepruefte Gesundheits-/Recovery-Evidenz. Dokumentierter Fortschritt muss mit Git/PR/CI-Realitaet uebereinstimmen.

### V4-Ziel

Append-only SHA-256-hashverkettete Zertifizierungsevidenz, strikte Gate-Reihenfolge und Konsistenzpruefung fuer maschinenlesbaren Roadmap-/Release-Status.

### Abnahme

Sample-Luecke, ungesunder Zustand, offene Recovery, Tamper/Corruption oder Statuswiderspruch -> Gate fail-closed.

# Bewusst verschobene V3-Bereiche

## Block 9 – Haendler und Bank

Noch **nicht** in Block 8.5 uebernehmen:

- `v3/src/economy/controlled-merchant-*.js`
- `v3/src/economy/merchant-space-recovery-*.js`
- `v3/src/reliability/alpha27-bank-recovery.js`
- `v3/src/reliability/alpha27-merchant-*.js`
- `v3/src/reliability/alpha28-merchant-transfers.js`
- `v3/src/reliability/alpha32-navigation-merchant-recovery.js`
- `v3/src/reliability/alpha33-mark-orbit-merchant-delivery.js`

Deren **Recovery-Prinzipien** duerfen dokumentiert werden; konkrete Bank-/Merchant-Fachlogik beginnt erst in Block 9.

## Block 10 – Wirtschaft

Noch nicht uebernehmen:

- atomare Economy-/Transaction-Implementierungen,
- Kaufen/Verkaufen/Upgrade/Kombinieren,
- Marktlogik.

Die generische Erkenntnis "mehrstufige Vorgaenge brauchen idempotente Transaktionen und Recovery" wird fuer spaetere Vertraege festgehalten, aber nicht vorgezogen.

## Block 11 – Lernen

Noch nicht uebernehmen:

- automatische Strategieanpassung,
- Progression-/Optimierungsintelligenz,
- lernende Auswahl.

Block 8.5 erzeugt nur die nachvollziehbaren Entscheidungs- und Ergebnisdaten, die Block 11 spaeter als Lernquelle verwenden darf.

## Block 14 – Update/Host-Restart

Noch nicht uebernehmen:

- `v3/src/ops/safe-auto-updater.js`
- automatische Release-Promotion,
- Host-/Browser-Restart-Ausfuehrung.

Block 8.5 darf lediglich Status und Neustart-Empfehlung bereitstellen. Die eigentliche Update-/Rueckfallautoritaet bleibt Block 14 bzw. einem externen Supervisor vorbehalten.

# Priorisierte Uebernahmereihenfolge fuer Block 8.5

1. versionierter `EntscheidungsDatensatz` fuer Gruppenentscheidungen
2. eindeutige Verknuepfung Entscheidung -> `AktionsAnfrage` -> Ergebnis
3. einheitlicher Runtime-Gesundheits- und Recovery-Zustand
4. generischer Recovery-Checkpoint-Vertrag
5. gemeinsame read-only StatusSchnittstelle
6. schlankes Ingame-HUD nur als Beobachter
7. sichere Pause/Fortsetzen-Bedienung ueber `BedienSicherung` und zentrale Steuerung
8. Fehler-/Schliessungs-/Reconnect-/Neustarttests fuer HUD und Runtime
9. gestufte Freigabe: offline -> Schatten -> kontrollierter Live-Test -> Soak

# Abschlussbedingung des Wissenstransfers

Der Wissenstransfer gilt als dokumentarisch abgeschlossen, wenn jedes fuer Block 8.5 relevante V3-Prinzip entweder:

- einem konkreten V4-Ziel und Test zugeordnet ist, oder
- mit Begruendung einem spaeteren Block zugeordnet wurde.

Er gilt **nicht** als Implementierungsabschluss von Block 8.5.
