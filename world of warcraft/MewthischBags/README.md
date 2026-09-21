# Mewthisch Bags v0.1

Mewthisch Bags ist eine eigenständige Taschenoberfläche für **World of Warcraft: Forever 1.60.1 / Interface 16001**.

## Zielbild

Die Blizzard-Taschenfenster werden unterdrückt und durch ein schlichtes, modernes Hauptfenster ersetzt.

Aktuell umgesetzt:

- Haupttitel wird automatisch aus der WoW-Clientsprache gewählt; auf Deutsch heißt er **„Tasche“**.
- Darstellung aller Inventarplätze aus Rucksack + maximal vier angelegten Taschen.
- Suchfeld ohne Umsortierung der Plätze:
  - neutrale Umrandung im Ruhezustand;
  - blaue Umrandung ausschließlich bei aktivem Eingabefokus;
  - Treffer werden deutlich umrandet;
  - nicht passende Gegenstände werden abgedunkelt.
- Gold, Silber und Kupfer werden oben mittig mit den originalen Blizzard-Münztexturen angezeigt; keine Buchstaben g/s/k.
- Hauptfenster ist horizontal größenveränderbar.
- Mindestbreite entspricht exakt vier Inventarplätzen plus den normalen Innenabständen.
- Beim Verändern der Breite wird das Slot-Raster automatisch auf die verfügbare Spaltenzahl umgebrochen und die Fensterhöhe passend neu berechnet.
- Fensterbreite und Position werden über MewthischBagsDB gespeichert.
- Taschen-Button links neben dem Schließen-X.
- Ausklappbare Taschenverwaltung mit:
  - exakt vier angelegten Taschenplätzen;
  - Kapazität direkt auf jedem angelegten Taschen-Icon;
  - verfügbaren Taschen aus dem Inventar;
  - bestmöglicher Kapazitätserkennung für nicht angelegte Taschen über die Tooltip-Daten des Clients.
- Das Taschenpanel passt seine Höhe automatisch an die Zahl verfügbarer Taschen an.
- Sind keine verfügbaren Taschen vorhanden, endet das Panel kurz unter der Überschrift „Verfügbare Taschen“ statt einen leeren Bereich anzuzeigen.
- Keine Taschennamen und keine separaten Austauschen-Buttons.
- Taschenwechsel per normalem WoW-Cursor/Drag-and-drop.
- Die Taschenverwaltung klappt zur Bildschirmmitte aus:
  - Hauptfenster rechts/zentral -> Panel links;
  - Hauptfenster links -> Panel rechts.
- Standardposition des Hauptfensters ist mittig; damit öffnet das Taschenpanel standardmäßig links.
- /mbags oder /mewthischbags öffnet/schließt das Fenster.
- /mbags reset setzt Fensterposition und Standardbreite zurück.

## API-Strategie

Wie Mewthisch Guides behandelt auch Mewthisch Bags Forever 1.60.1 als modernen, Retail-abgeleiteten Addon-Client:

- moderne C_Container-APIs werden bevorzugt;
- Legacy-Containerfunktionen dienen als Fallback;
- unsichere API-Aufrufe werden per pcall gekapselt;
- Taschenaktionen werden während InCombatLockdown() nicht erzwungen;
- Blizzard-Taschenfunktionen werden mit hooksecurefunc beobachtet statt global überschrieben.

## Ordner

Das Addon liegt neben Mewthisch Guides:

    world of warcraft/
    ├── MewthischGuides/
    └── MewthischBags/

## Entwicklungsstatus

v0.1 ist die erste lauffähige Implementierung. Vor einer Freigabe müssen die Runtime-Tests aus TESTPLAN.md auf WoW Forever durchgeführt werden, insbesondere das Verhalten der Blizzard-Taschenhooks, des Resizings, der Münztexturen und der Taschenwechsel.
