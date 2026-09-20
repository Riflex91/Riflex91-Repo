# ADR-005 – R6 bounded Evidence, RAM-Working-Sets und Learning-Evidence

**Status:** angenommen fuer R6 IN_PROGRESS.

## Kontext

V5 darf grosse Beobachtungs- und Analysehistorien auf der dedizierten SSD halten, aber der Gameplay-Hot-Path darf keine Vollscans oder nichtkritische SSD-Roundtrips benoetigen. Observation-Evidence und Learning duerfen zudem keine Gameplay-Autoritaet erhalten.

## Entscheidung

Observation-Evidence wird klar als WARM_SSD klassifiziert und durch Anzahl, Einzelgroesse und Gesamtgroesse begrenzt. Bei Grenzueberschreitung rotiert die aelteste nichtkritische Observation-Evidence deterministisch aus dem aktiven Fenster.

Ein Hintergrund-Aggregationsmodell verdichtet Evidence zu kleinen HOT_RAM-Working-Sets. Das Working-Set enthaelt nur bounded aktuelle Aggregate und traegt keine ExecutionAuthority.

Learning-Evidence ist schema-, Feature- und Modell-versioniert. Sie ist ausschliesslich ANALYSE_NACHWEIS, besitzt keine Gameplay- oder ExecutionAuthority und darf keine automatische Promotion oder Mutation ausloesen.

Ein einzelner LIVE_VERIFIZIERT-Fakt darf niemals automatisch zu einer allgemeinen Spielregel oder einem Action Contract generalisiert werden. Auch mehrere Evidence-Fakten fuehren nur zu PRUEFUNG_ERFORDERLICH.

Der GitHub-Live-Spiegel akzeptiert unter aktuell/** ausschliesslich LIVE_VERIFIZIERT-Fakten mit LIVE_SPIEL-Evidence. Rohtelemetrie, Replay, Journale, Checkpoints und grosse Learning-Datensaetze bleiben ausserhalb.

## Alternativen

Unbounded Rohhistorien im RAM werden verworfen, weil sie 24/7-Betrieb und deterministische Speicherbudgets gefaehrden.

Vollstaendige SSD-Historien im Gameplay-Hot-Path werden verworfen, weil nichtkritisches I/O keine zeitkritischen Entscheidungen blockieren darf.

Automatische Regelpromotion aus Learning- oder Einzelbeobachtungen wird verworfen, weil Evidence keine Gameplay-Autoritaet besitzt.

## Konsequenzen

- Observation-Evidence hat harte Speichergrenzen und Rotation.
- RAM-Working-Sets sind kompakt und reproduzierbar aus Evidence ableitbar.
- Learning bleibt analysierend und authority-frei.
- GitHub bleibt ein bounded Wissensspiegel und kein Telemetrie-Massenspeicher.
- Spaetere Runtime-Admission muss weiterhin frische Live-Preconditions pruefen.

## Invarianten

- Unbounded Rohtelemetrie ist verboten.
- HOT-RAM arbeitet nicht aus Vollscans grosser SSD-Historien.
- Learning-Evidence kann keine Mutation autorisieren.
- Ein einzelner Live-Fakt kann keine globale Spielregel autorisieren.
- GitHub-Livewissen enthaelt keine hochfrequente Rohtelemetrie.
- Runtime-Gesamtgate bleibt GESPERRT.

## Migration

Der Slice fuegt neue no-write R6-Komponenten hinzu. Bestehende R5-Persistenzports und R6-Snapshot-/Verifier-Vertraege bleiben kompatibel. Es werden keine bestehenden persistenten Daten automatisch migriert.

## Rollback

Die neuen Evidence-, Working-Set-, Learning- und Promotion-Komponenten koennen entfernt werden, ohne Gameplay-Zustand oder R5-Journale zu veraendern. Es existieren keine Raw Game Writes und keine wertveraendernden Migrationen.
