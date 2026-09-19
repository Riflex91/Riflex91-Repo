# V3-Kontingent-Paritaet fuer V4

Status: **verbindliche Referenzwerte und fail-closed Dienstprofile implementiert.**

## Ziel

V4 darf die fuer V3 bereits festgelegten Cloudflare- und Supabase-Grenzen niemals lockern oder stillschweigend durch groessere Kontingente ersetzen.

Die V3-Werte sind deshalb als versionierte V4-Referenz in `laufzeit/quelle/kern/v3-kontingent-paritaet.ts` gebunden und werden durch Tests gegen unbeabsichtigte Aenderungen geschuetzt.

## Cloudflare-Referenz aus V3

Workers:

- Free-Hard-Limit: **100000 Requests/Tag**
- internes V3-Ziel: **95000 Requests/Tag**
- Infrastrukturreserve: **5000 Requests/Tag**
- Botbudget: **90000 Requests/Tag**
- maximale Gruppengroesse: **4**
- V3-Budget je Charakter: **22500 Requests/Tag**

D1:

- **5000000 gelesene Zeilen/Tag**
- **100000 geschriebene Zeilen/Tag**

R2:

- Class A Hard-Limit: **1000000/Monat**
- V3-Budget: **950000/Monat**
- Class B Hard-Limit: **10000000/Monat**
- V3-Budget: **9500000/Monat**
- Storage Hard-Limit: **10000000000 Bytes**
- V3-Live-Storage-Budget: **9500000000 Bytes**
- Storage-Fenster: **8 Tage**
- Mindestabstand Archiv-Schreibvorgaenge: **15000 ms**
- maximales R2-Objekt: **262144 Bytes**
- Lifecycle: **7 Tage**

## Supabase-Referenz aus V3

- Edge-Function-Aufrufe: **500000/Monat**

## V4-Sicherheitsregel

Die genannten Hard-Limits sind die V3-Referenz und duerfen von V4 nicht erhoeht werden.

Wo V3 bereits ein kleineres internes Budget besitzt, verwendet V4 mindestens dieselbe Reserve:

- Workers: V4-Botbudget maximal **90000/Tag**
- R2 Class A: maximal **950000/Monat**
- R2 Class B: maximal **9500000/Monat**
- R2 Live Storage: maximal **9500000000 Bytes**

Bei D1 und Supabase bildet V3 derzeit die Hard-Limits ab, ohne ein separates kleineres V3-Budget zu definieren. V4 bleibt dort absichtlich konservativer und reserviert standardmaessig **5 Prozent Sicherheitspuffer**:

- D1 Reads: maximal **4750000/Tag**
- D1 Writes: maximal **95000/Tag**
- Supabase Edge Functions: maximal **475000/Monat**

Damit ist V4 niemals lockerer als V3.

## Gemeinsame Accounts und Parallelbetrieb

Ein nominelles Budget gehoert V4 nicht exklusiv, wenn V3, Dashboard oder andere Prozesse denselben Anbieteraccount verwenden.

Der `KontingentWaechter` muss deshalb den hoeheren Wert aus:

- lokaler V4-Reservierung und
- gemeinsam bzw. vom Anbieter gemeldetem Verbrauch

verwenden.

Bereits durch V3 oder Infrastruktur verbrauchtes Kontingent steht V4 nicht noch einmal zur Verfuegung.

## Gueltigkeit

Die Paritaetsfunktionen verlangen weiterhin:

- expliziten Pruefzeitpunkt,
- explizites Gueltigkeitsende,
- nachvollziehbare Quelle.

Die gebundenen V3-Zahlen ersetzen keine spaetere Anbieterpruefung. Ist ein tatsaechliches Anbieterlimit kleiner, ein Tarif geaendert oder die Quellenlage unklar, gilt der kleinere bzw. fail-closed Zustand.

## Harte Invarianten

- V4 erhoeht kein V3-Hard-Limit.
- V4 erhoeht kein bereits in V3 reduziertes internes Budget.
- V4 darf geteilte V3-/Dashboard-Nutzung nicht ignorieren.
- Abgelaufene Profile blockieren externe Arbeit.
- Unbekannte Anbieterwerte werden nicht geraten.
- Lokale Spielsicherheit bleibt von Cloudflare und Supabase unabhaengig.
