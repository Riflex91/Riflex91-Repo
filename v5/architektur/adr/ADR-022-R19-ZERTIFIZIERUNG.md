# ADR-022 – R19 Zertifizierungsladder und unveraenderliche Evidence

**Status:** RATIFIZIERT  
**Datum:** 2026-09-20

## Kontext

R19 ist die abschliessende 24/7-Zertifizierungsphase. Simulator/Replay, Fault Suite und Shadow koennen automatisiert nachgewiesen werden. Controlled Live und Canary erfordern dagegen einen realen manuellen Ingame-Nachweis und duerfen durch CI niemals automatisch als bestanden markiert werden.

## Entscheidung

1. Zertifizierungsevidence ist sequenziell, fingerprint-verkettet und append-only modelliert.
2. Sequenzspruenge, zu grosse Zeitabstaende oder veraenderte Sample-Inhalte werden als Evidence-Fehler erkannt.
3. Die globalen Null-Toleranz-Metriken werden pro Sample geprueft.
4. RAM-Historie, SSD-Aktivdaten, Segmentzahl, freie Bytes, I/O-Queue und SSD-I/O-Latenz besitzen explizite Zertifizierungsgrenzen.
5. Bounded/retained SSD-Wachstum ist zulaessig; unbounded growth ist nicht zulaessig.
6. Die Ladder ist strikt: Simulator/Replay -> Fault Suite -> Shadow -> Controlled Live -> Canary -> 1h -> 24h -> 72h -> 7d -> optional 30d.
7. Keine Stufe darf uebersprungen werden.
8. Controlled Live und Canary verlangen explizite manuelle Bestaetigung. CI kann diese Stufen technisch nicht auto-bestaetigen.
9. Shadow besitzt weder Gameplay- noch Raw-Write-Autoritaet.
10. Das R19-UI-Release-Gate verlangt 100 Prozent deutsche Pflichtabdeckung, null unerlaubte englische Rohtext-Leaks und nur die ratifizierte Monster-Originalname-Ausnahme.
11. Die breite Runtime bleibt bis zum vollstaendigen erfolgreichen R19-Abschluss GESPERRT.

## Konsequenzen

Die automatische Vorbereitung endet nach bestandenem Shadow und erzeugt eine maschinenlesbare Evidence, deren naechste Stufe CONTROLLED_LIVE ist. Erst dort ist wieder ein Benutzer am PC/Ingame erforderlich.

## Migration

R11 Operations-/Telemetrie- und R12 Shadow-/Controlled-Live-Primitiven werden wiederverwendet. Es entsteht keine zweite Runtime-Authority.

## Rollback

R19-Zertifizierungsbausteine sind no-write. Ein Rollback kann keine Adventure-Land-Mutation erzeugen. Unvollstaendige Ladder-Evidence bleibt unvollstaendig und darf nicht zu einer Freigabe hochgestuft werden.

## Nachweise

- `v5/grundlage/quelle/zertifizierung/evidence-kette.ts`
- `v5/grundlage/quelle/zertifizierung/ladder.ts`
- `v5/grundlage/quelle/zertifizierung/shadow-bewertung.ts`
- `v5/grundlage/tests/r19-evidence-ladder.test.mjs`
- `v5/grundlage/tests/r19-shadow-certification.test.mjs`
- `v5/werkzeuge/r19-ui-release-gate.mjs`
- `v5/roadmap/r19-automatik-evidence.json`
