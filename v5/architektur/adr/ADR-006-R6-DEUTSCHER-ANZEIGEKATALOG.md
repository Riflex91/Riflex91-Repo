# ADR-006 – R6 zentraler deutscher Anzeigekatalog

**Status:** angenommen fuer R6 IN_PROGRESS.

## Kontext

V5 verlangt eine vollstaendig deutsche sichtbare Oberflaeche. Adventure-Land-Rohkennungen bleiben an Systemgrenzen originalgetreu, duerfen aber nicht ungefiltert als Sichttext erscheinen. Monster besitzen eine enge Ausnahme fuer den originalen Spielnamen, wenn keine offizielle deutsche Spielbezeichnung existiert.

## Entscheidung

V5 verwendet einen zentralen versionierten Anzeigekatalog mit deutschen Kategorien. Skills benoetigen deutschen Anzeigenamen und deutsche Beschreibung. Klassen, Gegenstaende, Nichtspielerfiguren, Ereignisse, Aufgaben, Aktionen und Status benoetigen einen geprueften deutschen Anzeigenamen.

Fehlende normale Uebersetzungen zeigen niemals die englische Rohkennung. Stattdessen wird ein sicherer deutscher Platzhalter ausgegeben und die Katalogabdeckung bleibt unvollstaendig.

Monster duerfen ihren Originalnamen nur verwenden, wenn ein revalidierter Katalogeintrag explizit ORIGINALNAME_ERLAUBT traegt. Existiert eine offizielle deutsche Spielbezeichnung, muss der Eintrag DEUTSCH_OFFIZIELL tragen und die deutsche Bezeichnung gewinnt. V5 erfindet keine eigene Monster-Uebersetzung als angeblich offizielle Bezeichnung.

## Alternativen

Direkte Anzeige von Adventure-Land-Rohwerten wird fuer alle normalen Kategorien verworfen.

Ein pauschaler englischer Fallback wird verworfen.

Eine frei erfundene deutsche Monster-Uebersetzung wird als Ersatz fuer eine offizielle Spielbezeichnung verworfen.

## Konsequenzen

- Sichttext ist zentral versionierbar und testbar.
- Fehlende Uebersetzungen koennen keine englischen Rohkennungen leaken.
- Skill-Name und Skill-Beschreibung sind gemeinsam Pflicht.
- Monster-Herkunft ist maschinenlesbar nachweisbar.
- Wissens-Revalidierung kann spaeter von Originalname auf offizielle deutsche Bezeichnung umstellen.
- 100-Prozent-Abdeckung ist als maschinenlesbare Metrik pruefbar.

## Invarianten

- Sichtbare V5-Texte sind deutsch, ausser der eng begrenzten Monster-Originalname-Regel.
- Externe Rohkennungen bleiben Implementierungsdetail.
- Monster-Originalnamen brauchen expliziten revalidierten Nachweis.
- Eigene Monster-Uebersetzungen werden nicht als offiziell ausgegeben.
- Runtime-Gesamtgate bleibt GESPERRT.

## Migration

Der Katalog ist eine neue R6-Schicht. Bestehende externe Adventure-Land-Snapshots bleiben unveraendert. Spaetere Knowledge-Synchronisation kann Katalogeintraege versioniert aktualisieren.

## Rollback

Der Katalog-Slice kann ohne Gameplay- oder Persistenzmutation entfernt werden. Externe Rohdaten werden dabei nicht veraendert.
