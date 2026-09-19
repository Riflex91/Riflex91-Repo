# Block 8.6.7 – Status, HUD und Diagnose

Status: **implementiert; noch nicht gemergt oder operativ freigegeben.**

## Ziel

Block 8.6.7 macht die in Block 8.6.1 bis 8.6.6 aufgebauten Capability-Zustaende read-only sichtbar.

Die Anzeige darf keine neue Fachlogik einfuehren und keine Adventure-Land-Aktion ausloesen.

Sichtbar werden mindestens:

- Skill-Katalog-Zustand und Fingerprint,
- letzte erfolgreiche Audit-/Validierungsevidenz,
- Drift-/Stale-/Blockiergrund,
- Skill-Zahlen aktiv/gesamt,
- relevante Slider,
- lokale Character-Capabilities,
- Remote-Capability-Freshness,
- Catalog-Agreement,
- fail-closed Ausschlussgruende,
- capability-basierte Leader- und Aufgabenentscheidung.

## Neue Laufzeitbausteine

Vertrag:

`v4/laufzeit/quelle/vertraege/capability-status.ts`

Read-only Statusprojektion:

`v4/laufzeit/quelle/telemetrie/capability-status.ts`

Read-only Ingame-HUD:

`v4/werkzeuge/block8-6-capability-hud.js`

Regressionen:

- `v4/laufzeit/tests/capability-status.test.mjs`
- `v4/laufzeit/tests/capability-hud.test.mjs`

## Keine Aenderung der Block-8.5-Statusschnittstelle

Die bestehende `GemeinsameStatusSicht` und das bestehende Block-8.5-Ingame-HUD bleiben unveraendert.

8.6.7 fuehrt eine separate `CapabilityStatusSicht` ein.

Damit wird die immutable Block-8.5-Runtime nicht rueckwirkend erweitert.

## Read-only Autoritaetsgrenzen

`CapabilityStatusSicht` meldet immer:

- `nurLesen=true`,
- `spielAutoritaet=false`,
- `bedienAutoritaet=false`,
- `neustartAutoritaet=false`.

Das HUD akzeptiert nur Statusobjekte mit exakt diesen Autoritaetsgrenzen.

Das HUD besitzt keine Buttons fuer Skill-Ausfuehrung, Gruppenaktionen, Freigaben oder Neustarts.

## Skill-Katalog

Angezeigt werden:

- `zustand`,
- Generation,
- fachlicher Fingerprint,
- letzter erfolgreicher Audit-Zeitpunkt,
- letzte explizite Revalidierung,
- ob Bestaetigung erforderlich ist,
- `produktionsbereit`,
- Audit-Grund,
- Kataloggrund.

Drift, stale und blockiert bleiben voneinander unterscheidbar.

## Skills und SkillPolicy

Fuer jeden lokalen Skill werden angezeigt:

- Skill-ID und Name,
- strukturell vorhanden,
- `automationValidated`,
- technisch bereit,
- vom Nutzer freigegeben,
- fuer Automatisierung konfiguriert,
- aktuell automatisierbar,
- Target-Capacity,
- Skill-Grund,
- relevante Slider mit Wert und Bounds.

Zusammenfassend werden getrennt gezaehlt:

- gesamt,
- strukturell vorhanden,
- validiert,
- aktiv,
- technisch bereit,
- fuer Automatisierung konfiguriert,
- aktuell automatisierbar.

Dadurch wird beispielsweise ein eingeschalteter, aber wegen Equipment blockierter `5shot` sichtbar anders dargestellt als ein ausgeschalteter Skill.

## Lokale Capabilities

Die in 8.6.4 bereits abgeleiteten Capability-Zaehler werden read-only projiziert.

Angezeigt werden insbesondere:

- strukturelle Anzahl,
- validierte Anzahl,
- technisch bereite Anzahl,
- Nutzerfreigabe-Anzahl,
- konfigurierte Anzahl,
- aktuell automatisierbare Anzahl,
- maximale strukturelle Target-Capacity,
- maximale aktuell nutzbare Target-Capacity.

8.6.7 berechnet keine Capability-Tags oder Target-Capacities neu.

## Remote-Capabilities

Pro Remote-Teilnehmer werden getrennt angezeigt:

- Charakterkennung,
- Charaktername,
- Remote-Vertrauensstatus aus 8.6.5,
- bestehender Block-8-Livenessstatus,
- bestehendes Block-8-Livenessalter,
- Catalog-Agreement,
- beobachteter Remote-Katalog-Fingerprint,
- Remote-Capability-Generation,
- Remote-Capability-Fingerprint,
- Anzahl aktuell automatisierbarer Remote-Skills,
- Gruende der Remote-Vertrauenspruefung.

### Catalog-Agreement

Catalog-Agreement wird nur als Diagnoseprojektion aus bereits beobachteten Fingerprints berechnet:

- `stimmt`,
- `abweichend`,
- `unbekannt`.

Diese Anzeige erzeugt keine Vertrauensfreigabe.

Die eigentliche Vertrauensentscheidung bleibt Block 8.6.5.

Auch bei einer bereits fail-closed blockierten Remote-Vertrauenspruefung kann die Statusansicht den zuletzt empfangenen Remote-Fingerprint anzeigen, damit der konkrete Mismatch diagnostizierbar bleibt.

Der Diagnoseempfang wird dabei an **Charakterkennung plus Charaktername** gebunden. Ein neuerer Empfang mit derselben Kennung, aber anderem Namen, darf die Anzeige eines vertrauten Teilnehmers nicht ueberschreiben.

## Capability-basierte Gruppenwahl

Die in 8.6.6 bereits getroffene Entscheidung wird nur projiziert.

Sichtbar werden:

- Betriebsart,
- Leaderkennung,
- Leadername,
- Leadergrund,
- Aufgaben `heilen`, `schaden`, `aggro`, `schutz`, `unterstuetzung`,
- vertraute Teilnehmer,
- ausgeschlossene Teilnehmer und deren Grund.

Das HUD fuehrt selbst keine Leader- oder Aufgabenwahl aus.

## Diagnose

Die Statusprojektion erzeugt erklaerende Diagnoseeintraege aus bereits vorhandenen Zustandsausgaben.

Diagnosestufen:

- `info`,
- `warnung`,
- `blockiert`.

Initiale Diagnosecodes umfassen mindestens:

- `KATALOG_NICHT_PRODUKTIONSBEREIT`,
- `KATALOG_DRIFT`,
- `KATALOG_VERALTET`,
- `KATALOG_BLOCKIERT`,
- `SKILL_NICHT_VALIDIERT`,
- `SKILL_AKTIV_ABER_NICHT_AUTOMATISIERBAR`,
- `REMOTE_KATALOG_MISMATCH`,
- `REMOTE_CAPABILITY_NICHT_VERTRAUT`,
- `REMOTE_LIVENESS_NICHT_AKTIV`,
- `GRUPPENWAHL_TEILNEHMER_AUSGESCHLOSSEN`,
- `GRUPPENWAHL_KEIN_LEADER`,
- `CAPABILITY_STATUS_OK`.

Diagnose ist erklaerende Telemetrie.

Sie darf keine Safety-, Capability-, Trust- oder Autoritaetsentscheidung ersetzen.

## HUD

`block8-6-capability-hud.js` besitzt nur:

- Statusvalidierung,
- Formatierung,
- Anzeige-Modellerstellung,
- DOM-Rendering,
- Minimieren,
- Schliessen,
- optionale periodische read-only Aktualisierung.

Es besitzt insbesondere **keine**:

- SkillPolicy-Schreiboperation,
- `use_skill`,
- `attack`,
- `move`,
- `smart_move`,
- `send_cm`,
- Leaderwahl,
- Capability-Ableitung,
- Remote-Vertrauensentscheidung,
- Host-Neustartfunktion.

## HUD-Bereiche

Das Anzeige-Modell enthaelt genau die fachlichen Bereiche:

1. Skill-Katalog,
2. Skills & Policy,
3. lokale Capabilities,
4. Remote-Capabilities,
5. Capability-Gruppenwahl,
6. Diagnose.

Unbekannte oder fehlende optionale Daten werden als solche dargestellt und nicht durch Ersatzlogik erfunden.

## Determinismus

Die Statusprojektion sortiert fuer die Anzeige deterministisch:

- Skills nach Skill-ID,
- Capabilities nach Capability-Tag,
- Remote-Teilnehmer nach Charakterkennung/Name,
- vertraute Teilnehmer nach Kennung,
- ausgeschlossene Teilnehmer nach Kennung,
- Diagnose nach Stufe, Bereich, Bezug und Code.

Die Eingabeobjekte werden dabei nicht veraendert.

## Abnahme

Die Regressionen pruefen mindestens:

1. Katalogzustand und Fingerprint sichtbar,
2. letzte erfolgreiche Audit- und Revalidierungsevidenz sichtbar,
3. Skill aktiv/gesamt getrennt,
4. relevante Slider sichtbar,
5. lokale Capabilities sichtbar,
6. Remote-Freshness sichtbar,
7. Catalog-Agreement sichtbar,
8. blockierter Remote-Mismatch bleibt diagnostizierbar,
9. Drift-/Skill-/Remote-/Gruppenausschlussgruende werden diagnostiziert,
10. Remote-Diagnose bindet Kennung plus Name,
11. Statusprojektion ist deterministisch und mutiert Eingaben nicht,
12. Audit-/Capability-Identitaetsmismatch wird abgewiesen,
13. gesunder Zustand liefert `CAPABILITY_STATUS_OK`,
14. HUD akzeptiert nur read-only autoritaetsfreie Statusobjekte,
15. HUD zeigt alle sechs Bereiche,
16. HUD erfindet bei leeren Bereichen keine Ersatzlogik,
17. Anzeige-Modell mutiert Status nicht,
18. HUD bleibt ohne Dokument kontrolliert nicht installierbar.

## Nicht Bestandteil von 8.6.7

Noch nicht umgesetzt werden:

- Replay-/Regression-Integration fuer den kompletten Block-8.6-Zustand,
- operative Schatten-/Live-Freigabe,
- neue Adventure-Land-Spielaktion,
- neue Bedienautoritaet,
- neue Neustartautoritaet,
- Smart AoE,
- Lernen.

## Naechster Schritt

**8.6.8 – Replay und Regression.**
