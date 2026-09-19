# Block 8.6.3 – Per-Character SkillPolicy und Slider

Status: **implementiert; noch nicht gemergt oder operativ freigegeben.**

## Ziel

Block 8.6.3 fuehrt eine persistente, charaktergebundene Nutzer-Policy fuer Skills ein.

Die Policy entscheidet nur, ob ein vom Nutzer freigegebener Skill **grundsaetzlich** fuer spaetere Automatisierung in Frage kommt. Sie fuehrt selbst keine Adventure-Land-Aktion aus und besitzt immer `aktionsAutoritaet: false`.

Ein/Aus und Slider sind bewusst getrennt:

- Sliderwerte koennen konfiguriert werden, ohne den Skill einzuschalten.
- `SkillPolicy AUS` ist eine harte Sperre.
- Ein Slider oder spaeteres Lernen darf diese Sperre niemals uebergehen.

## Neue Laufzeitbausteine

Vertrag:

`v4/laufzeit/quelle/vertraege/skill-policy.ts`

Semantik:

`v4/laufzeit/quelle/spiellogik/skill-policy-semantik.ts`

Persistente Policy:

`v4/laufzeit/quelle/spiellogik/skill-policy.ts`

Regressionen:

`v4/laufzeit/tests/skill-policy.test.mjs`

## Per-Character statt Per-Class

Profile sind primaer an `charakterKennung` gebunden.

Gespeichert werden zusaetzlich:

- Charaktername,
- Klasse,
- Aenderungszeitpunkt,
- Skill-ID,
- Ein/Aus,
- Sliderparameter,
- der bei der Aenderung beobachtete Katalog-Fingerprint.

Zwei Ranger derselben Klasse erhalten dadurch **keine** gemeinsam geteilte Policy.

## Welche Skills konfigurierbar sind

Ein Skill erscheint nur als aktuell konfigurierbar, wenn:

1. der Live-`SkillKatalog` `bereit` ist,
2. keine Katalog-Bestaetigung offen ist,
3. ein aktueller Katalog-Fingerprint existiert,
4. der Skill im Live-Katalog vorhanden ist,
5. `automationValidated=true` gilt,
6. die Skill-Klasse zum konkreten Charakter passt,
7. die Charakterstufe die Skill-Voraussetzung erfuellt.

Neue oder unbekannte Skills werden dadurch nicht allein wegen beobachteter Tags oder ihres Namens konfigurierbar.

## Sicherer Standard

V4 uebernimmt absichtlich **nicht** V3s Legacy-Liste automatisch aktivierter Skills.

Neue Skill-Einstellungen starten immer:

`freigegeben=false`

Damit erzeugt das erstmalige Erkennen eines Skills keine neue Automatikautoritaet.

## Semantische Controls

Controls werden explizit pro validierter Skill-Semantik definiert. Ein Skill ohne sinnvollen Slider erhaelt nur Ein/Aus.

Initiale Controls in 8.6.3:

| Skill | Control | Bereich | Standard |
| --- | --- | ---: | ---: |
| `heal` | Lebensschwelle | 0–100 % | 65 % |
| `partyheal` | Lebensschwelle | 0–100 % | 72 % |
| `partyheal` | mindestens verletzte Mitglieder | 1–4 | 2 |
| `hardshell` | Lebensschwelle | 0–100 % | 45 % |
| `cleave` | mindestens Ziele | 1–8 | 3 |
| `stomp` | mindestens Ziele | 1–8 | 3 |
| `agitate` | maximal gewuenschte Ziele | 1–8 | 4 |
| `3shot` | mindestens Ziele | 1–Target-Capacity | 2 |
| `5shot` | mindestens Ziele | 1–Target-Capacity | 4 |
| `fanofknives` | mindestens Ziele | 1–Target-Capacity | 3 |
| `cburst` | mindestens Ziele | 1–8 | 2 |
| `cburst` | Mana-Budget | 5–50 % | 20 % |
| `energize` | Empfaenger-Mana-Schwelle | 0–100 % | 50 % |

Bei `3shot`, `5shot` und `fanofknives` wird das Slidermaximum aus der validierten Live-Target-Capacity begrenzt. Ein Nutzerwert oberhalb dieser Capacity wird nicht geklemmt oder geraten, sondern blockiert.

## Feste Grenzen statt stiller Korrektur

Control-Werte muessen:

- endlich sein,
- innerhalb von Minimum und Maximum liegen,
- zum definierten Schritt passen,
- bei Ganzzahlen wirklich ganzzahlig sein.

Ungueltige Werte werden abgewiesen.

V4 korrigiert solche Nutzereingaben nicht still auf einen anderen Wert.

## Unbekannte Controls

Ein unbekannter Control-Name kann nicht neu gespeichert werden.

Falls ein historisches persistiertes Profil einen inzwischen unbekannten Control enthaelt:

- bleibt die historische Information erhalten,
- der Skill wird aktuell fail-closed gesperrt,
- die unbekannte Einstellung wird sichtbar ausgewiesen,
- ein explizites Zuruecksetzen des Skills entfernt die historische Skill-Einstellung und stellt den sicheren Standard `AUS` wieder her.

Dasselbe gilt fuer bekannte Controls mit inzwischen ungueltigen historischen Werten.

## Persistenz

Schema:

`SKILL_POLICY_SCHEMA_VERSION = 1`

Standard-Schluessel:

`aio-v4-skill-policy-v1`

V4 verwendet die bereits vorhandene `SchluesselWertSpeicher`-Schnittstelle.

Persistenz ist transaktional:

1. die neue Policy wird als Kandidat aufgebaut,
2. der komplette versionierte Zustand wird kanonisch serialisiert,
3. der Speicher wird geschrieben,
4. erst nach erfolgreichem Schreiben wird der aktive In-Memory-Zustand ersetzt.

Ein Schreibfehler aktiviert dadurch **keine** nur teilweise gespeicherte Policy.

Unbekannte oder strukturell ungueltige Persistenzschema werden beim Laden fail-closed verworfen. Der Bot faellt dann auf sichere, leere Profile mit allen Skills `AUS` zurueck.

## Drift und historische Konfiguration

Ein `drift`-, `veraltet`- oder `blockiert`-Katalog entzieht der aktuellen Policy-Auswertung die Freigabe.

Historische Nutzerwerte werden dabei nicht geloescht.

Nach erfolgreicher Katalog-Revalidierung koennen dieselben historischen Einstellungen wieder verwendet werden, sofern:

- der Skill weiterhin existiert,
- `automationValidated=true` ist,
- Klasse und Level weiterhin passen,
- alle Controls weiterhin bekannt und gueltig sind,
- der Nutzer den Skill nicht ausgeschaltet hat.

## Policy-Entscheidung

Die SkillPolicy liefert eine read-only Vorentscheidung.

Moegliche blockierende Gruende sind mindestens:

- Katalog nicht bereit,
- Skill unbekannt,
- Automation nicht validiert,
- Klasse passt nicht,
- Level zu niedrig,
- SkillPolicy AUS,
- unbekannte persistierte Controls,
- ungueltige persistierte Controls.

Auch bei `erlaubt=true` bleibt:

`aktionsAutoritaet=false`

Denn technische Readiness, aktuelle Safety und die eigentliche kontrollierte Ausfuehrung folgen erst in spaeteren Schritten.

## Abnahme

Die Regressionen beweisen mindestens:

1. nur passende, validierte und levelgerechte Skills sind konfigurierbar,
2. neue Skills starten AUS,
3. zwei Charaktere derselben Klasse besitzen getrennte Policies,
4. Policy ueberlebt einen Neustart ueber versionierte Persistenz,
5. Sliderwerte sind hart begrenzt,
6. unbekannte Controls werden blockiert,
7. Slideraenderung schaltet einen Skill nicht automatisch ein,
8. Checkbox AUS bleibt harte Sperre,
9. Heal besitzt einen echten 0–100-%-Slider,
10. dynamische Target-Capacity begrenzt Multi-Target-Slider,
11. Katalogdrift sperrt aktuelle Freigabe ohne historische Daten zu loeschen,
12. unbekannte historische Controls sperren fail-closed,
13. ungueltige Persistenz wird fail-closed verworfen,
14. ein Speicherfehler aktiviert die Aenderung nicht.

## Nicht Bestandteil von 8.6.3

Noch nicht implementiert werden:

- charakterbezogene technische Skill-Readiness aus Equipment, Material, Cooldown und `can_use`,
- daraus abgeleitete `CharakterFaehigkeiten`,
- Cross-Client Capability Sync,
- capability-basierte Leaderwahl,
- HUD-/Web-Control-Rendering,
- Smart AoE,
- Lernen,
- neue Adventure-Land-Spielaktionsautoritaet.

## Naechster Schritt

**8.6.4 – CharakterFaehigkeiten.**
