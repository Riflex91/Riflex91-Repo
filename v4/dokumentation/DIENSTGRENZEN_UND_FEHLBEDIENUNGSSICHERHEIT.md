# Dienstgrenzen und Fehlbedienungssicherheit

## Ziel

V4 darf Nutzungs-, Kosten- oder technischen Grenzen externer Dienste nicht versehentlich ueberschreiten. Das gilt fuer Supabase, Cloudflare und jeden spaeter angebundenen Dienst.

Eine absolute Fehlerfreiheit kann technisch nicht garantiert werden. V4 wird deshalb so aufgebaut, dass ein einzelner Programmierfehler, eine falsche Bedienung, ein Neustart, eine veraltete Anbieterangabe oder eine unerwartete Dienstantwort nicht stillschweigend zu unbegrenzter Nutzung fuehren kann.

## Zentrale Regel

Kein Modul darf einen externen Dienst direkt aufrufen. Jeder externe Zugriff muss durch ein gemeinsames Dienst-Tor und den `KontingentWaechter` laufen.

Vor jeder Anfrage gilt:

1. geprueftes `DienstProfil` laden,
2. Gueltigkeit und Quelle pruefen,
3. alle durch den Vorgang moeglichen Verbrauchsarten bestimmen,
4. den maximal moeglichen Verbrauch konservativ reservieren,
5. lokalen Verbrauch und vom Anbieter gemeldeten Verbrauch vergleichen,
6. Sicherheitspuffer abziehen,
7. nur ausfuehren, wenn jede betroffene Grenze sicher eingehalten bleibt.

Ist einer dieser Punkte unbekannt, wird die externe Aktion blockiert statt geschaetzt.

## DienstProfil

Jeder Anbieter erhaelt ein eigenes versioniertes Profil mit mindestens:

- Dienstkennung
- Anzeigename
- aktuellem Tarif
- offizieller Quelle fuer die Grenzen
- Datum der letzten Pruefung
- Ablaufdatum der Pruefung
- allen relevanten Grenzen
- Einheit und Zeitfenster jeder Grenze
- Anbietermaximum
- bewusst reserviertem Sicherheitspuffer

Grenzwerte stehen nicht verteilt im Quellcode. Aendert ein Anbieter seinen Tarif oder seine Bedingungen, wird das Profil erneuert und getestet.

## Anbietergrenze ist nicht gleich V4-Budget

V4 nutzt niemals das komplette Anbietermaximum. Fuer jede Grenze wird ein Sicherheitspuffer reserviert.

Beispiel:

```text
Anbietermaximum:       100.000 Anfragen / Tag
Sicherheitspuffer:      10.000 Anfragen / Tag
Fuer V4 nutzbar:        90.000 Anfragen / Tag
```

Das Beispiel beschreibt nur das Verfahren und ist kein fest hinterlegter Anbieterwert.

Wenn andere Programme denselben Anbieteraccount verwenden, bekommt V4 zusaetzlich nur ein fest zugewiesenes Teilbudget. Dadurch kann fremde Nutzung nicht dazu fuehren, dass V4 selbst bis an das gemeinsame Konto-Limit plant.

## Schutzstufen

V4 kennt vier Schutzstufen:

- `normal` – Verbrauch ist unauffaellig
- `beobachten` – mindestens 70 Prozent des fuer V4 freigegebenen Budgets sind reserviert oder verbraucht
- `sparen` – mindestens 85 Prozent sind reserviert oder verbraucht; nicht notwendige Nutzung wird reduziert
- `blockiert` – die naechste Aktion wuerde das sichere Budget ueberschreiten oder die Grenzlage ist unbekannt

Die Prozentwerte beziehen sich auf das bereits um den Sicherheitspuffer reduzierte V4-Budget, nicht auf das volle Anbietermaximum.

## Reservieren vor Ausfuehren

Der wichtigste Schutz ist die Reservierung vor dem Aufruf.

Ein Vorgang muss seinen schlechtesten realistischen Verbrauch angeben. Erst wenn dieser Verbrauch fuer alle betroffenen Grenzen reserviert werden konnte, darf die Anfrage gesendet werden.

Kann der Maximalverbrauch nicht sinnvoll begrenzt werden, darf der Vorgang nicht automatisiert ausgefuehrt werden.

Reservierungen werden konservativ behandelt. Bei unklarem Ausgang wird Verbrauch nicht einfach wieder freigegeben. Dadurch kann eine unsichere Antwort niemals zu optimistischer Doppelverwendung desselben Kontingents fuehren.

## Neustarts und Zeitfenster

Verbrauchsstaende muessen ausserhalb des fluechtigen Prozesses gespeichert werden. Ein Neustart darf Zaehlungen nicht auf null setzen.

Zeitfenster erhalten eine eindeutige Kennung, zum Beispiel fuer einen Anbietertag oder Abrechnungsmonat. Ein neues Fenster wird erst verwendet, wenn sein Beginn eindeutig feststeht.

Anbieter koennen unterschiedliche Ruecksetzzeiten verwenden. V4 darf deshalb nicht pauschal Mitternacht Ortszeit annehmen.

## Anbieterwerte und eigene Zaehler

Wenn der Anbieter einen aktuellen Verbrauch meldet, verwendet V4 fuer die Sicherheitsentscheidung den konservativeren Wert:

`max(lokal reserviert, vom Anbieter gemeldet)`

Bei verzoegerten Anbieterstatistiken schuetzt damit weiterhin die lokale Vorabreservierung.

Wenn ein Anbieterwert hoeher als der lokale Wert ist, gewinnt der Anbieterwert sofort.

## Verhalten bei Grenznaehe

Nicht notwendige externe Arbeit wird zuerst reduziert, zum Beispiel:

- Telemetrie zusammenfassen statt jeden Einzelwert zu senden
- mehrere Schreibvorgaenge stapeln
- unveraenderte Werte nicht erneut speichern
- Web-Abfragen zwischenspeichern
- Berichte aus bereits lokal vorhandenen Daten erzeugen
- grosse Rohdaten spaeter gesammelt archivieren

Sicherheitsentscheidungen im Spiel duerfen niemals von Supabase, Cloudflare oder einem anderen externen Dienst abhaengen.

Wenn externe Dienste blockiert sind, laeuft die lokale Sicherheitslogik weiter. Daten werden nur in begrenzten lokalen Puffern gesammelt. Auch diese Puffer besitzen feste Groessen- und Altersgrenzen.

## Keine unendlichen Warteschlangen

Jede Warteschlange besitzt:

- maximale Anzahl Eintraege
- maximale Bytes
- maximales Alter
- klare Prioritaeten
- festes Verhalten bei Ueberlauf

Niedrig priorisierte Telemetrie darf verworfen oder zusammengefasst werden. Sicherheitsrelevante Informationen werden bevorzugt erhalten. Ein Speicherproblem darf nicht durch eine unbegrenzt wachsende Warteschlange entstehen.

## Fehlbedienungssichere Voreinstellungen

Neue Funktionen starten standardmaessig in der sichersten Betriebsart:

- externe Funktion zunaechst deaktiviert
- kein Dienstprofil -> blockiert
- abgelaufenes Dienstprofil -> blockiert
- unbekannter Verbrauch -> blockiert
- unbekanntes Zeitfenster -> blockiert
- widerspruechliche Zaehler -> hoeheren Wert verwenden
- Netzwerkfehler -> kein aggressives Sofort-Wiederholen
- wiederholte Fehler -> exponentielle Pause mit Obergrenze
- keine automatische Aufhebung eines Kosten- oder Kontingentstopps

## Supabase

Supabase besitzt mehrere voneinander getrennte Verbrauchsdimensionen. Einige Quoten gelten organisationsweit und werden ueber mehrere Projekte summiert. Deshalb muss das V4-Profil den tatsaechlich verwendeten Tarif und die Organisation beruecksichtigen.

Zu beobachten sind je nach eingesetzten Produkten mindestens:

- Egress
- Datenbankgroesse
- Storage-Groesse
- Edge-Function-Aufrufe
- Realtime-Nachrichten
- Realtime-Spitzenverbindungen
- Log-Ingest und Log-Abfragen, falls genutzt

Der Supabase Spend Cap ersetzt den V4-KontingentWaechter nicht.

## Cloudflare

Cloudflare besitzt unterschiedliche Grenzen und Abrechnungsarten fuer Workers, D1, R2 und weitere Produkte. Ein einziges globales Cloudflare-Limit ist deshalb nicht ausreichend.

Zu beobachten sind je nach eingesetzten Produkten mindestens:

- Worker-Anfragen und Unteranfragen
- CPU-/Ausfuehrungsgrenzen
- D1 gelesene und geschriebene Zeilen
- D1-Speicher
- R2-Speicher
- R2 Operationen Klasse A
- R2 Operationen Klasse B
- spaetere zusaetzliche Cloudflare-Produkte getrennt

## Neue Dienste

Ein neuer externer Dienst gilt erst als freigegeben, wenn:

1. offizielle Grenzdokumentation hinterlegt ist,
2. ein `DienstProfil` existiert,
3. alle fuer V4 relevanten Verbrauchsdimensionen bekannt sind,
4. Sicherheitspuffer festgelegt sind,
5. lokale Zaehler vorhanden sind,
6. Anbieterwerte soweit moeglich abgeglichen werden,
7. Grenztests bestanden sind,
8. Verhalten bei Ausfall und Grenzerreichung getestet wurde,
9. eine klare Nutzer-Meldung existiert.

## Narrensichere Meldungen

Eine Grenzmeldung nennt niemals nur einen Fehlercode.

Beispiel:

```text
[WARNUNG] SUPABASE_KONTINGENT_FAST_AUSGESCHOEPFT

Was ist passiert:
Das fuer V4 freigegebene Supabase-Kontingent fuer diesen Abrechnungszeitraum ist zu 87 Prozent genutzt oder reserviert.

Warum:
Weitere normale Schreibvorgaenge koennten den festgelegten Sicherheitspuffer gefaehrden.

Bot-Reaktion:
Nicht notwendige Telemetrie wird zusammengefasst. Die lokale Spiellogik laeuft weiter.

Nutzer muss handeln:
NEIN

Was soll ich tun:
Nichts. Der Bot reduziert den Verbrauch automatisch. Nur bei einer spaeteren kritischen Meldung muss die Dienstkonfiguration geprueft werden.
```

## Harte Invarianten

- Kein externer Aufruf ohne vorherige Kontingentpruefung.
- Kein unbekannter Verbrauch wird geraten.
- Kein abgelaufenes Dienstprofil wird weiterverwendet.
- Kein Neustart setzt Verbrauchszaehler unbemerkt zurueck.
- Kein externer Dienst ist fuer die lokale Spielsicherheit erforderlich.
- Keine Warteschlange darf unbegrenzt wachsen.
- Kein Anbieterlimit wird als voll nutzbares V4-Budget behandelt.
- Ein neuer Anbieter darf diese Regeln nicht umgehen.
