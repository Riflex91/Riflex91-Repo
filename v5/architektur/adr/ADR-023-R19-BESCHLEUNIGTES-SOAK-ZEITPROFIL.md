# ADR-023 – R19 beschleunigtes Soak-Zeitprofil

**Status:** RATIFIZIERT  
**Datum:** 2026-09-20

## Kontext

ADR-022 definierte nach Canary die Soak-Stufen 1h, 24h, 72h, 7d und optional 30d. Fuer den aktuellen Projektablauf wird dieses Zeitprofil explizit durch ein kuerzeres, weiterhin strikt sequenzielles Zertifizierungsprofil ersetzt.

## Entscheidung

1. Die R19-Soak-Ladder lautet ab sofort: `SOAK_5M -> SOAK_10M -> SOAK_30M -> SOAK_60M`.
2. `SOAK_60M` ist die finale Soak-Stufe; `SOAK_30D` entfaellt.
3. Jede Stufe bleibt fail-closed, muss ihre Mindestdauer und Mindest-Samplezahl erreichen und darf keine vorherige Stufe ueberspringen.
4. Null-Toleranz-, Evidence-Ketten-, Gap-, Speicher-, Persistenz- und Authority-Grenzen bleiben unveraendert.
5. Die breite Runtime bleibt bis zum Abschluss der gesamten neuen Ladder `GESPERRT`.
6. Historische Evidence wird nicht umgeschrieben; sie bleibt als Nachweis des damaligen Planungsstands erhalten.
7. Die neue Ladder wird als **beschleunigte Runtime-Zertifizierung** bezeichnet und nicht als mehrtaegige 24/7-Soak-Evidence.

## Alternativen

- Alte 1h/24h/72h/7d-Ladder beibehalten: verworfen fuer den aktuellen Projektablauf.
- Nur UI-Timer kuerzen, formale Anforderungen aber unveraendert lassen: verworfen, weil dadurch ein gruener Test die falsche Anforderung belegen wuerde.
- Alle Soak-Stufen zu einem einzelnen 60-Minuten-Test zusammenfassen: verworfen; gestufte Progression und Zwischen-Gates bleiben erhalten.

## Konsequenzen

Die Zertifizierung kann erheblich schneller abgeschlossen werden. Im Gegenzug sinkt die Evidenz fuer mehrtaegige Drift-, Leak- und Langzeitfehler. Dieser Trade-off wird explizit dokumentiert und nicht als gleichwertige 24/7-Evidence dargestellt.

## Invarianten

- Keine Stufe darf uebersprungen werden.
- Evidence bleibt fingerprint-verkettet und Gap-sensitiv.
- Null-Toleranz-Metriken bleiben unveraendert.
- Learning erhaelt keine Gameplay-Authority.
- Breite Runtime-Freigabe bleibt vor dem finalen SOAK_60M unzulaessig.

## Migration

`ZertifizierungsStufe`, Roadmap-Gates, OPS-006, Readiness, Validatoren und aktuelle Soak-Harnesses werden auf das neue Zeitprofil migriert. Bereits gespeicherte Shadow-/Controlled-Live-Evidence bleibt unveraendert.

## Rollback

Ein Rueckwechsel auf das alte Langzeitprofil erfordert eine erneute explizite Zeitprofil-Entscheidung und neue Soak-Evidence; bereits bestandene Kurzstufen duerfen nicht automatisch als 1h/24h/72h/7d-Evidence hochgestuft werden.

## Nachweise

- `v5/roadmap/r19-soak-zeitprofil.json`
- `v5/grundlage/quelle/zertifizierung/ladder.ts`
- `v5/anforderungen/anforderungen.json`
- `v5/roadmap/gates.json`
- `v5/werkzeuge/r19-struktur-pruefen.mjs`
