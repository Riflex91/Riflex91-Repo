# Adventure Land AiO Bot V5

V5 ist die neue Zielgeneration des Bots.

V3 bleibt Wissens-, Fehler-, Test- und Produktionsbeobachtungsquelle.
V4 bleibt Architekturprototyp, validierter Zwischenstand und Komponentenquelle.
V5 wird als neuer Runtime-Kern aus dem konsolidierten Wissen von V3, V4 und aktueller Adventure-Land-Recherche entwickelt.

## Aktueller Status

**Planungs- und Wissensphase. Noch kein V5-Gameplay-Runtime-Code.**

Vor der ersten Runtime-Implementierung werden:

1. die Wissensbasis versioniert und gegen Drift absicherbar gemacht;
2. die P0-Research-Luecken geschlossen;
3. V5-Verfassung und Kernvertraege festgeschrieben;
4. V3/V4-Komponenten systematisch als `PORTIEREN`, `UMBAUEN` oder `NUR_WISSENSQUELLE` klassifiziert;
5. die Master-Roadmap finalisiert;
6. Anforderungen, Gefahren, Invarianten und Zustandsautomaten formalisiert;
7. Fitness-, Persistenz-, Security-, Operator- und Teststrategie festgelegt;
8. der Wissenswaechter sicher an GitHub angebunden;
9. das formale Laufzeit-Bereitschaftsgate auf FREIGEGEBEN gesetzt.

## Einstieg

- `dokumentation/ADR-0001-V5-NEUSTART.md` – Architekturentscheidung V5.
- `dokumentation/V5-MASTER-ROADMAP.md` – verbindliche Entwicklungsreihenfolge mit Gates.
- `dokumentation/V5-DEFINITION-OF-DONE.md` – Pflichtkriterien fuer jede Capability.
- `dokumentation/DEUTSCHE_NAMEN_UND_NARRENSICHERHEIT.md` – verbindliche deutsche Domaenensprache, deutsche UI und gegenueber V4 verschaerfte Mehrfach-Verriegelung.
- `dokumentation/WISSENSWAECHTER-VERTRAG.md` – Sicherheitsvertrag fuer automatische Wissensaktualisierung und GitHub-Sync.
- `dokumentation/ENTWICKLUNGS-WISSENSGATE.md` – Pflichtprozess: aktuelles Wissen vor Planung, Implementierung und Merge.
- `dokumentation/LIVE-WISSEN-SSD-VERTRAG.md` – Bot-Writer-/Bridge-Mirror-Vertrag fuer live verifizierte Wissensdaten auf `D:\\`.
- `dokumentation/VOR-RUNTIME-SPEZIFIKATION.md` – letzte Pflichtvorbereitung vor Runtime-Code.
- `anforderungen/anforderungen.json` – kanonische Anforderungen.
- `anforderungen/nachverfolgbarkeit.json` – Wissen/Risiko/Invariante/Code/Test/Live-Nachweis.
- `gefahren/gefahrenkatalog.json` – FMEA-aehnlicher Fehler-/Gefahrenkatalog.
- `invarianten/invarianten.json` – 55 V4-Regeln plus neue V5-Haertungen.
- `zustaende/zustandsautomaten.json` – kritische Zustandsmodelle.
- `fitness/fitness-regeln.json` – Architektur-Fitnessregeln.
- `bereitschaft/laufzeit-bereitschaft.json` – einziges formales Vor-Runtime-Freigabegate.
- `roadmap/gates.json` – maschinenlesbarer Roadmap-/Abhaengigkeitszustand.
- `entwicklungsregeln/wissensnutzung.json` – maschinenlesbare Wissens-/Frische-/Driftregeln.
- `entwicklungsregeln/quellenfreigaben.json` – bewertete Quellenhash-Baselines; Drift sperrt relevante Implementierung.
- `wissensbasis/README.md` – Regeln der lebenden Wissensbasis.
- `wissensbasis/manifest.json` – maschinenlesbarer Einstiegspunkt.
