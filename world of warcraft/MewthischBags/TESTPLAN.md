# Mewthisch Bags — Forever Runtime-Testplan

## 1. Laden

1. Addon nach Interface/AddOns/MewthischBags kopieren.
2. WoW Forever starten oder /reload ausführen.
3. Prüfen, dass keine Lua-Fehler erscheinen.
4. /mbags ausführen.

Erwartung: Das Mewthisch-Bags-Fenster öffnet sich.

## 2. Blizzard-Taschen ersetzen

Nacheinander testen:

- Standard-Rucksacktaste;
- „Alle Taschen öffnen“;
- Standard-Tastenkürzel für Taschen;
- Taschen schließen.

Erwartung: Das Blizzard-Taschenfenster bleibt verborgen und Mewthisch Bags übernimmt Öffnen/Schließen ohne sichtbares Flackern.

## 3. Inventarplätze und Resize

- Rucksack und vier normale Taschen anlegen.
- Leere und belegte Plätze prüfen.
- Hauptfenster schmaler und breiter ziehen.
- Bis zur Mindestbreite verkleinern.

Erwartung: Alle Plätze aus Bag IDs 0–4 werden genau einmal dargestellt. Das Raster bricht passend um. Die Mindestbreite entspricht vier Slot-Spalten; darunter lässt sich das Fenster nicht verkleinern. Die Höhe passt sich automatisch dem Raster an.

## 4. Suche

- Suchleiste ohne Fokus ansehen.
- In das Suchfeld klicken.
- Teil eines lokalisierten Gegenstandsnamens eingeben.
- Groß-/Kleinschreibung variieren.
- Suchfeld mit Escape verlassen/leeren.

Erwartung: Die Suchleiste hat nur bei aktivem Eingabefokus eine blaue Umrandung. Treffer bleiben vollständig sichtbar und erhalten die Akzent-Umrandung; andere Gegenstände werden abgedunkelt. Die Positionen der Slots ändern sich nicht.

## 5. Geld

Gold/Silber/Kupfer mit Blizzard-Anzeige vergleichen.

Erwartung: Werte stimmen exakt. Hinter den Zahlen erscheinen die originalen Blizzard-Münzsymbole für Gold, Silber und Kupfer; es erscheinen keine Buchstaben g, s oder k.

## 6. Lokalisierung

Mindestens deDE und enUS/enGB testen.

Erwartung:
- deDE: Titel „Tasche“
- enUS/enGB: Titel „Bag“
- Panelüberschriften und Suchplatzhalter folgen ebenfalls der Clientsprache.

## 7. Taschenpanel

- Taschen-Icon links neben X anklicken.
- Vier angelegte Taschenplätze prüfen.
- Angezeigte Kapazitäten mit den tatsächlich angelegten Taschen vergleichen.
- Test ohne verfügbare Tasche im Inventar.
- Danach eine, vier und mehr als vier verfügbare Taschen ins Inventar legen.

Erwartung: Exakt vier angelegte Taschenplätze werden angezeigt. Verfügbare Taschen erscheinen darunter ohne Namen/Austauschen-Button. Die Panelhöhe wächst zeilenweise mit den verfügbaren Taschen. Bei null verfügbaren Taschen bleibt kein großer leerer Bereich unter der Überschrift. Bei sehr vielen Taschen wird die Höhe begrenzt und der Bereich scrollbar.

## 8. Taschen wechseln

Nur außerhalb des Kampfes testen:

1. Verfügbare Tasche aufnehmen/ziehen.
2. Auf einen der vier angelegten Taschenplätze ablegen.
3. Auch eine leere angelegte Tasche aufnehmen.

Erwartung: WoWs normale Taschenwechselregeln greifen. Das Addon versucht keine Umgehung geschützter Aktionen.

## 9. Adaptive Ausklapprichtung

- Hauptfenster auf die rechte Bildschirmhälfte ziehen und Panel öffnen.
- Hauptfenster auf die linke Bildschirmhälfte ziehen und Panel öffnen.
- /mbags reset ausführen.

Erwartung:
- rechts/zentral: Panel klappt links aus;
- links: Panel klappt rechts aus;
- nach Reset ist das Hauptfenster mittig, wieder auf Standardbreite und das Panel öffnet links.

## 10. Kampf

- Taschenfenster geöffnet lassen.
- Kampf beginnen.
- Taschenpanel öffnen und Drag-and-drop versuchen.

Erwartung: Anzeige bleibt stabil; Taschenwechsel wird im Lockdown nicht erzwungen. Nach Kampfende aktualisiert sich das Panel.

## 11. Cache/Item-Info

- Direkt nach Login nach Taschen suchen.
- Falls zunächst „?“ bei einer verfügbaren Tasche erscheint, Item-Tooltip öffnen bzw. Itemdaten laden.

Erwartung: GET_ITEM_INFO_RECEIVED invalidiert den Kapazitätscache und aktualisiert die Anzeige.
