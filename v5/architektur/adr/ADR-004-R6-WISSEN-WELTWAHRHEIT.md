# ADR-004 – R6 Wissenszugriff, Beobachtung und abgeglichene Weltwahrheit

Status: angenommen fuer R6 IN_PROGRESS.

## Kontext

R5 liefert die crash-sichere no-write Persistenzgrundlage. R6 trennt Definitionen, echte Spielbeobachtung und abgeglichene Weltwahrheit technisch, ohne persistiertem Wissen Gameplay-Autoritaet zu verleihen.

## Entscheidung

Persistiertes Wissen wird ausschliesslich ueber einen read-only WissensZugriffPort konsumiert. Ein WissensSnapshot wird vor Nutzung schema-, hash- und groessenvalidiert und anschliessend auf eine Snapshot-Kennung gepinnt.

LIVE_VERIFIZIERT darf ausschliesslich durch einen FachlicherLiveVerifier aus einer echten LIVE_SPIEL-Beobachtung entstehen. Definitionen, Annahmen oder GitHub-Snapshots allein koennen diesen Status nicht erzeugen.

Frische, Widerspruch und fehlende Beobachtung werden fail-closed als BESTAETIGT, VERALTET, WIDERSPRUCH oder UNBEKANNT modelliert. Auch BESTAETIGT bleibt Planungsnachweis und setzt mutationAutorisiert immer auf false.

Wissensdrift kann betroffene Faehigkeiten auf QUARANTAENE setzen. Automatische Freigabe aus Quarantaene ist in R6 ausgeschlossen.

## Sicherheitsfolgen

- keine Raw Game Writes;
- keine Gameplay-Autoritaet aus Persistenz oder GitHub;
- keine direkte Nutzung von Wissensbasis-Rohpfaden aus Gameplay-Modulen;
- keine Mutation allein aufgrund von LIVE_VERIFIZIERT;
- Runtime-Gesamtgate bleibt GESPERRT.

## Folgeschritte

Weitere R6-Slices liefern bounded Beobachtungshistorie und RAM-Arbeitsmengen, Learning-Nachweise ohne Autoritaet sowie die deutschen Anzeige- und Monsterkataloge.
