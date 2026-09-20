# ADR-021 – R18 Learning und Optimierung

**Status:** RATIFIZIERT  
**Datum:** 2026-09-20

## Kontext

R18 fuehrt Learning erst nach der deterministischen Safety-/Authority-/World-Basis ein. Die ratifizierten Risiken verlangen authority-freies Learning, read-only bounded influence, deterministischen Fallback und unveraenderliche Policy-Precedence.

## Entscheidung

1. Learning darf nur Ranking-/Scoring-Vorschlaege innerhalb bereits hard-erlaubter Kandidaten veraendern.
2. Hard-verbotene Kandidaten koennen durch Learning niemals freigegeben werden.
3. Score-Einfluss ist explizit bounded.
4. Ein deterministischer Fallback existiert immer und ist ohne Learning voll funktionsfaehig.
5. Safety-, Authority-, Operator-, Quarantaene-, Budget- und Retry-Grenzen werden vor Learning geprueft und koennen durch Learning nicht ueberstimmt werden.
6. Learning Evidence bleibt analyse-only und besitzt keine Gameplay-, Ausfuehrungs- oder MutationAuthority.
7. Die Datenbasis wird mit Wissenssnapshot, Feature-Schema, Modellversion und Datenfingerprint gepinnt.
8. Challenger starten ausschliesslich im Shadow.
9. Safety-/Invariant-Verletzungen oder Sample-Gaps verhindern Promotion.
10. Promotion ist explizit und setzt saubere gebundene Evidence voraus.
11. Auch ein Champion erhaelt durch die Modell-Liga keine GameplayAuthority; die Liga waehlt kein Gameplay direkt aus.
12. R18 erzeugt keine Raw Game Writes.

## Alternativen

- Learning direkt Actions waehlen lassen: verworfen.
- Learning Hard Caps anheben lassen: verworfen.
- Kein Fallback bei Modellfehler: verworfen.
- Challenger sofort Canary-Traffic geben: verworfen.
- automatische Promotion allein anhand Quality-Metrik: verworfen.
- V3 Brain Runtime importieren: verworfen.

## Konsequenzen

R19 kann Learning in Shadow/Controlled-Live/Canary zertifizieren, ohne dass das Modell Safety oder Authority besitzen muss. Learning-off bleibt jederzeit ein sicherer Betriebsmodus.

## Invarianten

- V5-ALT-022 – Learning lockert Safety oder Authority nicht.
- V5-INV-021 – Operator Deny kann nicht umgangen werden.
- V5-INV-026 – Safety-kritische Learning-Grenzen besitzen Negativtests.

## Migration

V3 Brain-/Adaptive-Learning-Code dient nur als Design- und Testquelle. V5 importiert keine V3/V4 Runtimeklasse oder persistierte Modellweights.

## Rollback

Learning kann vollstaendig deaktiviert werden; dann bleibt der deterministische Fallback aktiv. Challenger koennen jederzeit quarantiniert werden. Ein Rollback veraendert keine GameplayAuthority.

## Nachweise

- `v5/grundlage/quelle/lernen/deterministischer-fallback.ts`
- `v5/grundlage/quelle/lernen/lern-admission.ts`
- `v5/grundlage/quelle/lernen/datenbasis-pin.ts`
- `v5/grundlage/quelle/lernen/modell-liga.ts`
- `v5/grundlage/tests/r18-fallback-ranking.test.mjs`
- `v5/grundlage/tests/r18-admission-evidence.test.mjs`
- `v5/grundlage/tests/r18-modell-liga.test.mjs`
