# ADR-004 – R6 Wissenszugriff, Beobachtung und abgeglichene Weltwahrheit

**Status:** angenommen fuer R6 IN_PROGRESS.

## Kontext

R5 liefert die crash-sichere no-write Persistenzgrundlage. R6 trennt Definitionen, echte Spielbeobachtung und abgeglichene Weltwahrheit technisch, ohne persistiertem Wissen Gameplay-Autoritaet zu verleihen.

## Entscheidung

Persistiertes Wissen wird ausschliesslich ueber einen read-only WissensZugriffPort konsumiert. Ein WissensSnapshot wird vor Nutzung schema-, hash- und groessenvalidiert und anschliessend auf eine Snapshot-Kennung gepinnt.

LIVE_VERIFIZIERT darf ausschliesslich durch einen FachlicherLiveVerifier aus einer echten LIVE_SPIEL-Beobachtung entstehen. Definitionen, Annahmen oder GitHub-Snapshots allein koennen diesen Status nicht erzeugen.

Frische, Widerspruch und fehlende Beobachtung werden fail-closed als BESTAETIGT, VERALTET, WIDERSPRUCH oder UNBEKANNT modelliert. Auch BESTAETIGT bleibt Planungsnachweis und setzt mutationAutorisiert immer auf false.

Wissensdrift kann betroffene Faehigkeiten auf QUARANTAENE setzen. Automatische Freigabe aus Quarantaene ist in R6 ausgeschlossen.

## Alternativen

Direkter Zugriff spaeterer Gameplay-Module auf GitHub-, SSD- oder Roh-Snapshot-Dateien wird verworfen, weil damit Pinning, Schema-/Hash-Validierung und Authority-Trennung umgangen werden koennten.

LIVE_VERIFIZIERT direkt aus Definitionen oder Planerannahmen abzuleiten wird verworfen, weil nur echte Spielbeobachtung plus fachlicher Verifier diesen Status begruenden darf.

Persistiertes Wissen als ExecutionAuthority zu behandeln wird verworfen. Frische Live-Admission bleibt fuer spaetere wertveraendernde Aktionen zwingend.

## Konsequenzen

- Wissenszugriff ist read-only und snapshot-gepinnt.
- Definition, Beobachtung, live verifizierter Fakt und abgeglichene Weltwahrheit bleiben getrennte Typen.
- VERALTET, WIDERSPRUCH und UNBEKANNT bleiben fail-closed.
- Wissensdrift kann Faehigkeiten in QUARANTAENE setzen.
- Keine R6-Wissenslage autorisiert eine Mutation.
- Weitere R6-Slices muessen dieselbe Authority-Trennung beibehalten.

## Invarianten

- Persistiertes Wissen besitzt keine Gameplay-Autoritaet.
- LIVE_VERIFIZIERT entsteht nur aus LIVE_SPIEL plus Fachverifier.
- Ein gepinnter Snapshot darf innerhalb eines laufenden Konsumenten nicht still wechseln.
- Unbekannter, geaenderter oder quarantinierter Inhalt bleibt fail-closed.
- Runtime-Gesamtgate bleibt GESPERRT.

## Migration

R6 baut ausschliesslich neue V5-Typen und Ports auf der R5-Grundlage auf. V3/V4-Runtime-Code wird nicht portiert. Bestehende R5-Persistenzvertraege bleiben unveraendert und dienen nur als Speichergrenze fuer spaetere Evidence.

## Rollback

Der R6-Slice kann durch Ruecknahme der neuen wissen/**-Module, R6-Tests, R6-CI und Guard-Erweiterungen entfernt werden, ohne R5-Persistenzdaten oder Gameplay-Zustand zu veraendern. Es existieren keine Raw Game Writes und keine wertveraendernden Migrationen.
