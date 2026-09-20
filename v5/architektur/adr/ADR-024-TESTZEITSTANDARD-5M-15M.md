# ADR-024 – Verbindlicher Testzeitstandard: 5 Minuten Funktion, 15 Minuten Integration/Release

**Status:** AKZEPTIERT  
**Stand:** 2026-09-20  
**Betrifft:** V5 Entwicklung, Live-Funktionsabnahme, Integrations- und Release-Gates, R19

## Kontext

Lange Soak-Stufen nach jeder einzelnen neuen Funktion verlangsamen die Entwicklung stark und wiederholen einen grossen Teil derselben Beobachtung. Gleichzeitig darf eine kuerzere Testdauer keine Safety-, Authority-, Persistenz-, Evidence- oder Null-Toleranz-Grenze lockern.

Der bereits gestartete R19-SOAK_10M wird nicht nachtraeglich entwertet.

## Entscheidung

1. Eine neue oder geaenderte einzelne Funktion/Capability gilt nach ihren statischen, Unit-, Replay-, Fault- und erforderlichen Preflight-Gates mit einem **bestandenen realen 5-Minuten-Test** als funktional abgenommen.
2. Laengere Soaks werden **nicht fuer jede einzelne Funktion** wiederholt.
3. Integrations-, Meilenstein- und Release-Gates verwenden kuenftig einen **15-Minuten-Test**.
4. Der bereits gestartete **R19-SOAK_10M** bleibt als einmalige Uebergangs-Zwischenstufe gueltig.
5. R19 endet danach mit **SOAK_15M** als finalem Integrations-/Release-Test. Die bisherigen SOAK_30M- und SOAK_60M-Stufen entfallen.
6. Ein spaeter entdeckter Defekt oeffnet die betroffene Funktion wieder. Nach dem Fix ist mindestens der 5-Minuten-Funktionstest zu wiederholen; betrifft der Defekt Integration oder Release-Verhalten, ist zusaetzlich der 15-Minuten-Test zu wiederholen.
7. Die kuerzere Testdauer aendert keine Null-Toleranz-, Evidence-Ketten-, Sample-Gap-, Speicher-, Persistenz-, Performance-Trick-, Authority- oder Gameplay-Write-Grenze.
8. Ein bestandener 5- oder 15-Minuten-Test wird nicht als mehrtaegige 24/7-Soak-Evidence bezeichnet.

## R19-Migration

Vorher:
`SOAK_5M -> SOAK_10M -> SOAK_30M -> SOAK_60M`

Ab jetzt:
`SOAK_5M -> SOAK_10M (bereits laufende Uebergangsstufe) -> SOAK_15M (finales Integration-/Release-Gate)`

Das aktuelle maschinenlesbare Profil ist `R19_ACCELERATED_SOAK_V2`.

## Konsequenzen

- Entwicklungsiteration wird deutlich schneller.
- Seltene Langzeitfehler haben eine geringere Chance, innerhalb eines einzelnen Funktionsgates sichtbar zu werden.
- Dieses Restrisiko wird bewusst akzeptiert und durch nachfolgende Funktions-, Integrations- und Release-Tests teilweise kompensiert.
- Safety- und fail-closed-Regeln bleiben unveraendert.
- Die breite Runtime bleibt bis zur expliziten Gesamtfreigabe gesperrt.

## Maschinenlesbarer Vertrag

- `v5/roadmap/testzeit-standard.json`
- `v5/roadmap/r19-soak-zeitprofil.json`
