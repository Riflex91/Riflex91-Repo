# Block 8 – minimaler Gruppenziel-Ausfuehrungspfad

Status: **Adapter, gebundene Einmal-Freigabe und feste Ausfuehrungsbruecke implementiert und offline getestet; keine Live-Freigabe**.

## Entscheidung fuer die erste Aktion

Als erster und einziger aktiver Block-8-Adapter wird `GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN` vorbereitet.

`GRUPPE_UNTERSTUETZEN`, Heilen, Schutz und Aggro werden bewusst noch nicht aktiv umgesetzt. Deren konkrete Adventure-Land-Skill-Semantik ist noch nicht eng genug festgelegt, um ohne Raten einen sicheren Aufruf zu erlauben.

Der gemeinsame Zielschaden besitzt dagegen eine eindeutige minimale Abbildung:

`GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN -> attack(sichtbaresGemeinsamesZiel)`

## Harte Freigabegrenzen

`AdventureLandGruppenZielAusfuehrung` liegt ausschliesslich unter `laufzeit/quelle/ausfuehrung/` und startet mit `aktivFreigegeben: false`.

Eine persistente boolesche Freigabe reicht nicht mehr aus. Zusaetzlich ist eine `AdventureLandGruppenZielEinmalFreigabe` erforderlich. Sie wird mit dem exakten Text `BLOCK8-GRUPPENZIEL-EINMAL-FREIGEBEN` an genau eine AktionsAnfrage-Kennung gebunden und beim ersten Ausfuehrungsversuch **vor allen weiteren dynamischen Checks** verbraucht. Damit bleibt der Adapter nach Erfolg, Safety-Wechsel, Ressourcenverlust oder anderem Fehler automatisch wieder gesperrt.

Auch mit expliziter Aktivierung und gebundener Einmal-Freigabe wird vor `attack(...)` erneut verlangt:

- die Anfrage wurde von der zentralen `AktionsSteuerung` gestartet und ist weiterhin `laeuft`,
- `angefordertVon` ist exakt `gruppen-aktionsplanung`,
- der Aktionsname ist exakt `GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN`,
- die Details beschreiben einen geplanten Schadensschritt auf ein Gegnerziel,
- die Anfrage benoetigt exakt `gruppe` und `kampfziel`,
- beide Ressourcen gehoeren unmittelbar vor der Ausfuehrung weiterhin derselben Anfrage,
- eine Kampfsicherheitsentscheidung ist nicht in der Zukunft, nicht aelter als der Gruppenplan und hoechstens 1500 ms alt,
- `normalAktionenErlaubt` ist wahr, die Sicherheitsaktion ist `keine` und die Gefahrenstufe ist exakt `sicher`,
- Adventure Land meldet den normalen Angriff explizit als `bereit`,
- das gemeinsame Ziel ist weiterhin sichtbar und bestaetigt lebendig,
- der lokale Charakter ist bestaetigt lebendig,
- Ziel und Charakter liegen, soweit beobachtbar, auf derselben Karte,
- das Ziel befindet sich unmittelbar vor dem Aufruf in aktueller Angriffsreichweite.

Jede fehlende oder widerspruechliche Voraussetzung bricht die zentrale Gruppenanfrage ab und gibt deren Ressourcen frei. Es wird nichts geraten.

## One-shot Testwerkzeug

`v4/werkzeuge/block8-gruppenziel-one-shot.js` stellt `V4Block8GruppenZielOneShot` bereit.

Das Werkzeug:

- startet gesperrt,
- erzeugt zuerst eine read-only Vorschau ueber den vorhandenen zentralen Block-8-Schattenpfad,
- laesst nur `gemeinsames_ziel_bearbeiten` / `GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN` zu,
- prueft aktuelle Block-7-Safety, Angriffsbereitschaft, Ziel und Reichweite erneut read-only,
- verlangt den exakten Freigabetext,
- bindet die Freigabe an genau die in der Vorschau gestartete AktionsAnfrage und ihr Ziel,
- sperrt **vor** jeder spaeteren Delegation automatisch wieder,
- besitzt selbst keinen Adventure-Land-Aktionsaufruf.

Eine echte Delegation ist nur an die feste API `V4Block8GruppenZielAusfuehrungsBruecke` erlaubt. Diese muss sich mit `quelleBereich: "ausfuehrung"` und dem exakt erlaubten Aktionsnamen ausweisen.

## Feste Produktionsbruecke

`v4/laufzeit/quelle/ausfuehrung/adventure-land-gruppen-ziel-ausfuehrungs-bruecke.ts` implementiert diesen Vertrag jetzt als Produktionsklasse.

Die Bruecke ist selbst standardmaessig gesperrt und jede aktivierte Instanz besitzt genau **einen** Ausfuehrungsversuch. Dieser Versuch wird vor der weiteren Auftragsvalidierung verbraucht. Die Bruecke:

- akzeptiert nur `schemaVersion: 1`, den exakten Aktionsnamen und den exakten One-shot-Freigabetext,
- verwirft alte oder zukuenftige Freigaben,
- rekonstruiert die Anfrage ausschliesslich aus der zentralen `AktionsSteuerung`,
- verlangt weiterhin den Zustand `laeuft`, Herkunft `gruppen-aktionsplanung` und ein noch gueltiges Zeitfenster,
- vergleicht die Zielkennung des Browserauftrags mit der zentral laufenden Anfrage,
- **ignoriert Browser-Vorpruefungen als Autoritaet**,
- verlangt stattdessen eine neue Produktions-`KampfSicherheitsEntscheidung`, die nicht aelter als die explizite One-shot-Freigabe ist,
- erzeugt intern eine frische gebundene `AdventureLandGruppenZielEinmalFreigabe`,
- delegiert danach ausschliesslich an `AdventureLandGruppenZielAusfuehrung`,
- ruft selbst keine Adventure-Land-Spielaktion direkt auf,
- bricht eine passende noch laufende zentrale Anfrage fail-safe ab, wenn der verbrauchte Brueckenversuch scheitert.

## Aktueller Freigabestand

Die one-shot Freigabelogik und die feste Produktionsbruecke sind implementiert und offline abgesichert. **Noch nicht vorhanden ist die Live-Bindung**, die genau eine explizit aktivierte Brueckeninstanz mit der realen zentralen `AktionsSteuerung` und einer frischen Produktions-Sicherheitsquelle im Adventure-Land-Kontext verbindet und als `V4Block8GruppenZielAusfuehrungsBruecke` exponiert. Ohne diese Bindung kann das Browserwerkzeug weiterhin keine echte Gruppen-Spielaktion ausloesen; der Live-Smoke bleibt gesperrt.

Automatisiert werden unter anderem geprueft:

- Default-Lock bleibt reiner Schatten und ruft `attack` nicht auf,
- der exakt freigegebene Erfolgsfall ruft `attack` genau einmal auf und verbraucht die Einmal-Freigabe vorher,
- verlorener Ressourcenbesitz blockiert,
- Safety-Wechsel und stale Safety blockieren,
- unbekannte Angriffsbereitschaft blockiert,
- unsichtbares, totes oder zu weit entferntes Ziel blockiert,
- abgelaufene, falsch gebundene oder bereits verbrauchte Einmal-Freigaben blockieren,
- die feste Produktionsbruecke akzeptiert pro Instanz hoechstens einen Versuch und vertraut nicht auf Browser-Safety als Autoritaet,
- das Browser-One-shot delegiert hoechstens einmal und bleibt bei Safety-Wechsel oder fehlender Live-Bindung gesperrt,
- alle anderen `GRUPPE_*`-Aktionsnamen besitzen keinen aktiven Pfad.

Der naechste Schritt nach gruenem Merge ist die **eng begrenzte Live-Bindung der festen Bruecke** an die reale zentrale Steuerung und eine frische Produktions-Sicherheitsquelle. Auch diese Bindung wird zuerst offline getestet. Erst danach darf der kontrollierte one-shot Live-Smoke tatsaechlich ausgefuehrt werden.
