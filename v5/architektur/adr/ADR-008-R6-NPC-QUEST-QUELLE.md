# ADR-008 – R6 gepinnte NPC- und Quest-Quellmenge

**Status:** angenommen fuer R6 IN_PROGRESS.

## Kontext

Die vorhandene V5-Wissensdatenbank enthielt Maps, Events, Skills, Items und Monster, aber keinen eigenen aktuellen NPC-Datensnapshot. Dadurch waren die erwarteten NPC- und Quest-Mengen fuer die deutsche UI-Abdeckung nicht maschinenlesbar definiert.

## Entscheidung

R6 pinnt einen abgeleiteten, kompakten Quellenbestand aus der aktuellen offiziellen Datei `kaansoral/adventureland_mongodb/design/npcs.js`. Der gepinnte Blob ist `a99d3b18c5099a1824d0bd0c780bd2eabf1d53cb`.

Es werden nur die fuer den Katalog benoetigten Metadaten gespeichert: NPC-Kennung, Originalname, Rolle, Quest-Kennung und Kennzeichnung programmgenerierter Bankfach-NPCs. Der vollstaendige Upstream-Quelltext wird nicht dupliziert.

Die offizielle Datei definiert 95 NPCs explizit und erzeugt `items8` bis `items47` programmatisch; damit umfasst die Quellmenge 135 NPCs. Aus den `quest`-Feldern ergeben sich 12 Quest-Kennungen.

## Alternativen

Nur die aktuell in Maps platzierten NPCs zu katalogisieren wird verworfen, weil dynamische oder saisonale Definitionen dadurch fehlen koennen.

Quest-Kennungen aus Namen oder Beschreibungen zu erraten wird verworfen.

Den kompletten Upstream-Quelltext in den Anzeigekatalog zu kopieren wird verworfen.

## Konsequenzen

- NPC- und Quest-Abdeckung ist exakt messbar.
- Dynamische NPC-Definitionen sind Teil der erwarteten Menge.
- Quest-Kennungen stammen direkt aus offiziellen NPC-Definitionen.
- Die Quelle ist auf einen konkreten offiziellen Blob gepinnt.
- Die spaetere Aufnahme von `design/npcs.js` in den automatischen Wissenswaechter bleibt sinnvoll.

## Invarianten

- Keine NPC- oder Quest-Kennung wird geraten.
- Quellendrift darf nicht still als neue Katalogwahrheit gelten.
- Externe Originalkennungen bleiben an der Systemgrenze erhalten.
- Sichtbare Katalognamen sind deutsch oder unveraenderte Eigennamen.
- Runtime-Gesamtgate bleibt GESPERRT.

## Migration

Der abgeleitete Quellenbestand wird als versioniertes Anzeigetext-Evidence-Artefakt eingefuehrt. Bestehende Knowledge-Snapshots werden nicht veraendert.

## Rollback

Das Artefakt und die darauf basierenden Katalogeintraege koennen ohne Gameplay- oder Persistenzmutation entfernt werden.
