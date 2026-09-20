# ADR-007 – R6 Verifier-gebundene Live-Wissenspublikation

**Status:** angenommen fuer R6 IN_PROGRESS.

## Kontext

R5 stellt einen sicheren Low-Level-Speicher fuer Live-Wissen bereit. R6 muss verhindern, dass Planerannahmen, Definitionen oder ungepruefte Daten allein als LIVE_VERIFIZIERT publiziert werden. Observation-Evidence soll ausserdem ueber eine typisierte Persistenzgrenze lokal fuer Replay und Analyse gespeichert werden koennen.

## Entscheidung

Der fachliche Pfad zur Live-Wissenspersistenz fuehrt ueber den LiveWissensPublizierer. Er akzeptiert ausschliesslich LiveVerifizierterFakt mit Status LIVE_VERIFIZIERT, Quelle LIVE_SPIEL und ohne ExecutionAuthority. Erst danach wird der R5-LiveWissensSpeicherPort aufgerufen.

Zeitformatierung wird ueber einen injizierten ZeitTextPort bereitgestellt, damit der fachliche Kern keine direkte Systemzeit verwendet.

Direkte Verwendung des Low-Level-Live-Wissenswriters ausserhalb der Persistenz- und Publizierer-Grenze wird statisch blockiert.

Bounded Observation-Evidence wird ueber die BeobachtungsEvidenceAblage und den bestehenden typisierten PersistenzPort gespeichert. Sie bleibt Evidence ohne ExecutionAuthority.

## Alternativen

Direkte Verwendung des R5-LiveWissensSpeicherPort durch Planer oder Gameplay-Module wird verworfen.

LIVE_VERIFIZIERT als frei setzbarer Persistenzstring ohne fachliche Publizierer-Grenze wird verworfen.

Beliebiger Dateisystemzugriff fuer Observation-Evidence wird verworfen.

## Konsequenzen

- fachliche Verifikation und technische Persistenz sind getrennt;
- Low-Level-Persistenz verleiht keine fachliche Autoritaet;
- nur der definierte Publizierer darf fachlich verifizierte Live-Fakten in Generationen ueberfuehren;
- Observation-Evidence kann lokal persistiert werden, ohne Rohdateizugriff zu eroeffnen;
- Runtime-Admission bleibt weiterhin separat erforderlich.

## Invarianten

- Planerannahmen erzeugen kein LIVE_VERIFIZIERT.
- Persistenz allein erzeugt keine Gameplay-Autoritaet.
- Direkter Live-Wissenswriter-Bypass ist verboten.
- Observation-Evidence bleibt bounded und authority-frei.
- Runtime-Gesamtgate bleibt GESPERRT.

## Migration

Der Publizierer wird oberhalb der bestehenden R5-Persistenz eingefuegt. R5-Dateiformat und SCHREIBT/BEREIT-Protokoll bleiben unveraendert.

## Rollback

Die R6-Publikationsschicht kann ohne Veraenderung bestehender R5-Persistenzdaten entfernt werden. Es existieren keine Raw Game Writes oder wertveraendernden Migrationen.
