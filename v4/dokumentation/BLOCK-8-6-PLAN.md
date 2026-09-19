# Block 8.6 – Live Skill Catalog und Capability Truth

Status: **Block 8.6 aktiv; 8.6.1 bis 8.6.8 implementiert; 8.6.9 Release-Candidate exakt gebunden, immutable deployed, öffentlich per HTTPS verifiziert und realer Schatten bestanden; kontrolliert live und Soak noch offen.**

Naechster operativer Schritt: **8.6.9 – kontrollierten Live-Lauf mit der bestandenen Schattenuebergabe ausfuehren; danach Soak**

## Ziel

Block 8.6 schafft eine einzige, nachvollziehbare Wahrheit darueber, welche Skills und daraus abgeleiteten Faehigkeiten ein Charakter **jetzt tatsaechlich** besitzt, technisch einsetzen kann und laut Nutzerkonfiguration automatisch einsetzen darf.

Die bestehenden groben Gruppenfaehigkeiten aus Block 8 bleiben als stabile fachliche Schnittstelle erhalten, werden aber nicht mehr aus statischen Annahmen gespeist.

## Verbindliche Sicherheitsregeln

- Adventure-Land-Live-Daten sind technische Quelle, aber nicht automatisch Automationsfreigabe.
- Ein erkannter neuer oder geaenderter Skill bleibt bis zur V4-Validierung fail-closed.
- `SkillPolicy AUS` ist eine harte Sperre und darf von Planner, Gruppenlogik oder spaeterem Lernen nicht uebergangen werden.
- Catalog-/Capability-Daten mit unbekannter Version, stale Zustand oder Fingerprint-Mismatch duerfen keine aggressive oder neue Autoritaet erzeugen.
- Cross-Client Capability Sync erweitert den bestehenden Block-8-Kommunikationspfad; er fuehrt kein zweites Liveness-Protokoll ein.
- Fehlende Remote-Daten werden nicht durch Klassenheuristiken ersetzt.
- Keine neue direkte Adventure-Land-Aktionsfunktion ausserhalb der bestehenden V4-Ausfuehrungsgrenzen.
- Block 8.6 implementiert weder Smart AoE noch Lernen.

## V3-Belege

Die folgenden V3-Arbeiten dienen als Erfahrungsquelle, nicht als Copy/Paste-Codebasis:

- PR #364 – Live Skill Catalog, SkillPolicy und konfigurierbare Skill Controls,
- PR #375 – Cross-Client Capabilities in StrategicBrainV2,
- PR #348 – Bedarf an deterministischer Combat-Leaderwahl; die konkrete statische Klassenprioritaet wird **nicht** uebernommen.

## 8.6.1 – Skill-Katalog-Vertrag und Live-Lesequelle — **IMPLEMENTIERT**

Gemeinsam umgesetzt:

- versionierter `SkillKatalog`,
- normalisierte Skill-ID und technische Metadaten,
- beobachtete Klasse/Level-/MP-/Cooldown-/Range-/Equipment-/Material-Voraussetzungen,
- Capability-Tags und Target-Capacity,
- `automationValidated`,
- Katalogzustand mindestens `bereit`, `veraltet`, `drift`, `blockiert`,
- stabile Fingerprints ueber die fuer Automatisierung relevanten Skill-Eigenschaften.

Umsetzungsnachweis: `BLOCK-8-6-1-SKILL-KATALOG.md`.

Abnahme:

- gleiche Live-Skill-Daten erzeugen denselben fachlichen Fingerprint,
- reine Laufzeit-/Zeitstempelwerte veraendern den Fingerprint nicht,
- unbekannte Felder erzeugen keine erfundene Automationsfreigabe,
- neuer unbekannter Skill bleibt sichtbar, aber nicht automatisch nutzbar.

## 8.6.2 – Audit, Drift und Recovery-Revalidierung — **IMPLEMENTIERT**

Audits werden mindestens ausgeloest bei:

- Runtime-Start,
- Recovery/Wiederverbindung,
- Serverwechsel,
- Charakterwechsel,
- relevanter Level-/Skill-Aenderung,
- periodischem Kontrollintervall.

Regeln:

- Connection-Gap setzt den Katalog auf veraltet,
- Drift sperrt betroffene Automationsannahmen,
- produktionsbereit erst nach bestaetigter Revalidierung,
- kein versteckter Auto-Restart,
- Recovery darf keine alte Capability-Generation still weiterverwenden.

Abnahme:

- stale -> Recovery -> Revalidation,
- echte Skill-Drift,
- identischer zweiter Audit,
- widerspruechlicher zweiter Audit,
- Neustart mit altem persistentem Profil aber neuem Katalog.

Umsetzungsnachweis: `BLOCK-8-6-2-AUDIT-REVALIDIERUNG.md`.

## 8.6.3 – Per-Character SkillPolicy und Slider — **IMPLEMENTIERT**

Pro Charakter werden nur passende, validierte Skills konfigurierbar.

Controls werden skill-semantisch modelliert, z. B.:

- Ein/Aus,
- HP-Schwelle 0–100 %,
- Mindestanzahl verletzter Ziele,
- Mindestanzahl Ziele fuer Multi-Target/AoE,
- MP-Budget,
- weitere nur dann, wenn der Skill eine klare fachliche Bedeutung dafuer besitzt.

Regeln:

- feste Min-/Max-Grenzen,
- sichere Defaults,
- unbekannte Controls werden blockiert,
- Persistenz ist versioniert,
- Katalogdrift invalidiert keine historischen Daten, kann aber aktuelle Ausfuehrungsfreigabe entziehen.

Umsetzungsnachweis: `BLOCK-8-6-3-SKILL-POLICY.md`.

## 8.6.4 – CharakterFaehigkeiten — **IMPLEMENTIERT**

Aus Katalog + technischer Readiness + SkillPolicy werden pro Charakter konkrete Capabilities abgeleitet.

Mindestens getrennt:

- strukturell vorhanden,
- aktuell technisch bereit,
- vom Nutzer freigegeben,
- aktuell fuer Automatisierung konfiguriert.

Die bestehenden Gruppenwerte

- `heilen`,
- `schaden`,
- `aggro`,
- `schutz`,
- `unterstuetzung`

werden daraus reproduzierbar abgeleitet.

Zusatzdaten wie Multi-Target-Damage, AoE-Control, Party-Heal oder Target-Capacity bleiben explizite Capabilities und werden nicht in einem einzigen Score versteckt.

Umsetzungsnachweis: `BLOCK-8-6-4-CHARAKTER-FAEHIGKEITEN.md`.

## 8.6.5 – Cross-Client Capability Sync — **IMPLEMENTIERT**

Der bestehende vertrauensgebundene Block-8-Lebensnachweis transportiert einen bounded Capability-Snapshot.

Snapshot mindestens:

- Charakter/Klasse/Level,
- Capability-Generation/Fingerprint,
- Catalog-State/Generation/Fingerprint,
- nur validierte Skills,
- enabled/configuredReady,
- relevante bounded Sliderparameter,
- Target-Capacity,
- Capability-Tags.

Remote-Daten gelten nur als vertraut, wenn:

- Senderidentitaet passt,
- Daten frisch sind,
- lokaler Katalog bereit ist,
- Remote-Katalog bereit ist,
- fachlicher Catalog-Fingerprint uebereinstimmt.

Missing/Stale/Mismatch -> fail-closed.

Umsetzungsnachweis: `BLOCK-8-6-5-CAPABILITY-SYNC.md`.

## 8.6.6 – Capability-basierte Leader- und Aufgabenwahl — **IMPLEMENTIERT**

V4 uebernimmt **nicht** die statische V3-Prioritaet `warrior > paladin > ranger > ...`.

Stattdessen wird eine deterministische Auswahl aus:

- fuer die aktuelle Aufgabe benoetigten Capabilities,
- aktueller Safety,
- Freshness,
- technischer Readiness,
- vorhandener Autoritaet

abgeleitet.

Charakterkennung/Name ist nur deterministischer Tie-Breaker.

Ein Teilnehmer ohne frische validierte Capability-Daten kann keine hoeherwertige Aufgabe allein wegen seiner Klasse erhalten.

Umsetzungsnachweis: `BLOCK-8-6-6-CAPABILITY-GRUPPENWAHL.md`.

## 8.6.7 – Status, HUD und Diagnose — **IMPLEMENTIERT**

Read-only sichtbar werden mindestens:

- Katalogzustand und Fingerprint,
- letzte erfolgreiche Validierung,
- Drift-/Stale-Grund,
- Skills aktiv/gesamt,
- relevante Slider,
- lokale Character-Capabilities,
- Remote-Capability-Freshness,
- Catalog-Agreement der Gruppe,
- Grund fuer fail-closed Capability-Ausschluss,
- aktuelle capability-basierte Aufgaben-/Leaderentscheidung.

Das HUD enthaelt keine neue Fachlogik.

Umsetzungsnachweis: `BLOCK-8-6-7-STATUS-HUD-DIAGNOSE.md`.

## 8.6.8 – Replay und Regression — **IMPLEMENTIERT**

Der bestehende V4-Wiederholungsweg erhaelt reproduzierbare Katalog-/Capability-Eingaben.

Pflichtfaelle:

- zwei Ranger mit unterschiedlichen 3shot/5shot-Einstellungen,
- Skill AUS trotz technischer Readiness,
- Level-Up schaltet neuen bekannten Skill frei,
- Equipmentverlust entzieht Readiness,
- unbekannter neuer Skill,
- stale Remote-Capability,
- Fingerprint-Mismatch,
- Connection-Gap und Recovery,
- gleiche Inputs -> gleiche Capability- und Leaderentscheidung.

Umsetzungsnachweis: `BLOCK-8-6-8-REPLAY-REGRESSION.md`.

## 8.6.9 – Freigabe — **RELEASE-CANDIDATE DEPLOYED/HTTPS + SCHATTEN VERIFIZIERT; LIVE/SOAK OFFEN**

Block 8.6 folgt denselben Laufzeit-Gates wie Block 8.5:

1. deterministische Offline-/Replay-Abnahme,
2. Schattenbetrieb ohne neue Spielaktion,
3. begrenzter kontrollierter Live-Test,
4. Soak mit Telemetrie und Recovery-Auswertung.

Block 9 darf erst beginnen, wenn alle vier Stufen fuer denselben finalen Block-8.6-Aenderungsstand bestanden sind.

Vorbereiteter technischer Pfad:

- separater Block-8.6-Candidate neben der unveraenderten Runtime 1.1.5,
- passives Mitlesen nur bereits vom Block-8-Handler akzeptierter Liveness-Evidenz,
- Schatten bei 0 Heartbeat-/Capability-Sendungen,
- kontrolliert live nur als explizit bestaetigter Capability-One-Shot,
- 10-Minuten-Soak mit 5-Sekunden-Sampling,
- Recovery-Nachweis nur mit an denselben Candidate gebundener 8.6.8-Replay-Evidenz.

Umsetzungs-/Vorbereitungsnachweis: `BLOCK-8-6-9-FREIGABE-VORBEREITUNG.md`.

Release-Bindung: `BLOCK-8-6-9-RELEASE-CANDIDATE.md` plus maschinenlesbares `BLOCK-8-6-9-RELEASE-CANDIDATE.json`. Der exakte gruene Candidate ist `ca0dfee7685563c8b6003469300c8fd08777b053` mit 51 Modulen / 396471 Bytes / SHA-256 `b5d39ac692157ec98c9c77cc7d4afca0b39a0b67abbabbcc31b863a6b0f77ea5`. Offline/Replay ist gebunden.

Deployment-/HTTPS-Nachweis: `BLOCK-8-6-9-CANDIDATE-DEPLOYMENT-NACHWEIS.md`. Workflow-Run `35441831873` / Job `105893861206` hat immutable R2-Publish, R2-Rueckvergleich und oeffentlichen HTTPS-Rueckvergleich fuer exakt denselben Candidate erfolgreich bestaetigt.

Realer Schattennachweis: `BLOCK-8-6-9-SCHATTEN-FREIGABE-NACHWEIS.json`. Der Lauf `block8-6-schatten-1789822653521` hat fuer exakt denselben Candidate PASS, 0 Heartbeat-Sendeversuche und 0 Capability-Sendeversuche bestaetigt.

Noch nicht als bestanden markiert werden duerfen kontrollierter Live-Lauf oder Soak.

## Folgeabhaengigkeiten

- **Block 9** nutzt Capability Truth fuer Merchant-/Dienstvoraussetzungen und beginnt mit einem ACK-/Dedup-faehigen Dienstnachrichtenprotokoll.
- **Block 10.5** nutzt die validierten Capabilities fuer deterministische Smart-AoE-Hard-Capacity und Encounter Lifecycle.
- **Block 11** nutzt Capability-Snapshots plus Encounter-Outcomes als Lernfeatures; Lernen darf die deterministische Hard Capacity niemals umgehen.
- **Block 14** und die finale Freigabekampagne pruefen maschinenlesbaren Roadmap-/Release-Status gegen reale Git-/CI-/Laufzeitevidenz.
