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

## 3. Inventarplätze

- Rucksack und vier normale Taschen anlegen.
- Leere und belegte Plätze prüfen.
- Stackgrößen prüfen.
- Gegenstände per Linksklick aufnehmen.
- Gegenstände per Rechtsklick benutzen.
- Gegenstände zwischen Plätzen ziehen.

Erwartung: Alle Plätze aus Bag IDs 0–4 werden genau einmal dargestellt und normale Inventaraktionen funktionieren.

## 4. Suche

- Teil eines lokalisierten Gegenstandsnamens eingeben.
- Groß-/Kleinschreibung variieren.
- Suchfeld mit Escape leeren.

Erwartung: Treffer bleiben vollständig sichtbar und erhalten die moderne Akzent-Umrandung; andere Gegenstände werden abgedunkelt. Die Positionen der Slots ändern sich nicht.

## 5. Geld

Gold/Silber/Kupfer mit Blizzard-Anzeige vergleichen.

Erwartung: Werte stimmen exakt und verwenden die Blizzard-eigenen Gold-/Silber-/Kupfer-Symbole.

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
- Mehrere unangelegte Taschen im Inventar bereithalten.

Erwartung: Exakt vier angelegte Taschenplätze werden angezeigt. Verfügbare Taschen erscheinen darunter ohne Namen/Austauschen-Button. Die Kapazität wird als Zahl auf dem Icon dargestellt; falls der Forever-Tooltip keine auswertbare Kapazität liefert, steht bei einer nicht angelegten Tasche „?“.

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
- nach Reset ist das Hauptfenster mittig und das Panel öffnet links.

## 10. Kampf

- Taschenfenster geöffnet lassen.
- Kampf beginnen.
- Taschenpanel öffnen und Drag-and-drop versuchen.

Erwartung: Anzeige bleibt stabil; Taschenwechsel wird im Lockdown nicht erzwungen. Nach Kampfende aktualisiert sich das Panel.

## 11. Cache/Item-Info

- Direkt nach Login nach Taschen suchen.
- Falls zunächst „?“ bei einer verfügbaren Tasche erscheint, Item-Tooltip öffnen bzw. Itemdaten laden.

Erwartung: GET_ITEM_INFO_RECEIVED invalidiert den Kapazitätscache und aktualisiert die Anzeige.
