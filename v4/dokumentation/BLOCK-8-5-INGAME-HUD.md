# Block 8.5 – schlankes Ingame-HUD

Status: **8.5.6 implementiert als rein beobachtendes Browser-HUD ohne Spiel-, Bedien- oder Neustartautoritaet**.

## Ziel

Das Ingame-HUD macht den bereits vorhandenen V4-Zustand im Adventure-Land-Browser sichtbar. Es ist nur eine Anzeige und keine zweite Bot-Steuerung.

Die Datenquelle ist ausschliesslich die in Schritt 8.5.5 eingefuehrte gemeinsame `StatusSchnittstelle`.

Das HUD berechnet keine neue Spielentscheidung, keine Gruppenrolle, keine Safety-Entscheidung und keinen Recovery-Pfad.

## Datenquelle

Das HUD akzeptiert nur eine `GemeinsameStatusSicht`, die explizit meldet:

- `schemaVersion: 1`
- `nurLesen: true`
- `spielAutoritaet: false`
- `bedienAutoritaet: false`
- `neustartAutoritaet: false`

Weicht eines dieser Autoritaetsmerkmale ab, wird die Anzeige fail-safe abgewiesen.

Damit kann eine spaetere Oberflaeche nicht versehentlich einen veraendernden Statusvertrag als read-only HUD-Datenquelle verwenden.

## Angezeigte Bereiche

Das HUD zeigt sieben kleine Bereiche:

1. **Charakter**
   - Name
   - Klasse
   - Stufe
   - Leben
   - Mana
   - Karte
   - Instanz
   - Tot-Status

2. **Runtime & Safety**
   - Recovery-Stufe
   - Safety
   - Gruppen-Liveness
   - Snapshot-Alter
   - Heartbeat-Alter
   - Alter des fachlichen Fortschritts
   - offene und abgebrochene AktionsAnfragen
   - Nutzer-Handlungsbedarf
   - Host-Neustartempfehlung

3. **Gruppe**
   - Betriebsart
   - Gefahrenstufe
   - gemeinsames Ziel
   - aktive Teilnehmer
   - Aufgabenverteilung
   - Begruendung

4. **Entscheidung**
   - Entscheidungskennung
   - gewaehlte Entscheidung
   - Quelle
   - Grund
   - verknuepfte AktionsAnfragen

5. **Aktionsphasen**
   - AktionsAnfrage-Kennung
   - aktuelle Phase
   - Aktionsname
   - Zustandsgrund

6. **Recovery-Checkpoint**
   - Ladestatus
   - Slot
   - Sequenz
   - Fallback
   - Wiederaufnahme erlaubt
   - Abgleich erforderlich
   - Aktionsautoritaet

7. **Letzte Meldung**
   - Stufe
   - Titel
   - Was ist passiert
   - Warum
   - Bot-Reaktion
   - Nutzeraktion

## Wissenszustaende

Die Anzeige behaelt die V4-Unterscheidung zwischen:

- `bekannt`
- `fehlend`
- `unbekannt`

bei.

Ein bekannter `null`-Wert wird als `null` angezeigt und nicht in `fehlend` oder `unbekannt` umgedeutet.

Fehlende und unbekannte Werte zeigen ihren vorhandenen Grund an.

Das HUD erfindet keine Ersatzwerte.

## Browserintegration

`v4/werkzeuge/block8-5-ingame-hud.js` installiert die globale read-only API:

`V4IngameHud`

Version: `1.0.0`.

Die API bietet:

- `pruefeStatusSicht(...)`
- `formatiereStatusWert(...)`
- `erstelleAnzeigeModell(...)`
- `erstelleHud(...)`

Das erzeugte HUD-Objekt bietet nur lokale Anzeigeoperationen:

- Status aktualisieren
- read-only Statuslieferant verbinden/trennen
- HUD oeffnen
- HUD schliessen
- eigenen HUD-Status lesen

## Keine veraendernde Bedienung in 8.5.6

Das HUD besitzt bewusst noch keine Bot-Bedienknopfe fuer:

- Pause,
- Fortsetzen,
- Kampf,
- Bewegung,
- Gruppenaktionen,
- Recovery,
- Neustart.

Im sichtbaren HUD existieren nur zwei lokale Oberflaechenaktionen:

- **Minimieren**
- **Schliessen**

Diese veraendern nur die Darstellung des HUD.

Die sichere Basisbedienung folgt separat in **8.5.7** und muss dann durch `BedienSicherung` und zentrale Laufzeit-/Aktionssteuerung laufen.

## Fehlerisolation

Ein Fehler des Statuslieferanten, der Statusvalidierung oder der Darstellung:

- wird im HUD als `HUD-Fehler` angezeigt,
- wird innerhalb des HUD abgefangen,
- startet keine Recovery,
- pausiert den Bot nicht,
- veraendert keine AktionsAnfrage,
- veraendert keine RessourcenSperre.

Schliessen des HUD:

- versteckt nur das HUD,
- stoppt nur den eigenen HUD-Aktualisierungstimer,
- veraendert die Bot-Laufzeit nicht.

Wieder oeffnen kann den HUD-Timer erneut starten, wenn ein read-only Statuslieferant verbunden ist.

## Aktualisierung

Ein optionaler `statusLieferant` kann in einem begrenzten Intervall gelesen werden.

Standard: **1000 ms**.

Die Untergrenze ist **250 ms**, damit das HUD nicht unkontrolliert schnell pollt.

Dieser Timer gehoert ausschliesslich der Anzeige. Er ist weder Produktionsheartbeat noch Bot-Takt.

## Sicherheitsgrenze

Das HUD darf nicht:

- `attack`
- `move`
- `smart_move`
- `use_skill`
- `send_cm`
- oder andere Adventure-Land-Spielaktionen aufrufen,
- eine `AktionsAnfrage` einreichen oder verarbeiten,
- eine laufende Aktion abbrechen oder abschliessen,
- einen Browser-/Host-Neustart ausloesen,
- Fachlogik aus Gruppenkoordination, Safety oder Recovery duplizieren.

Es liest nur die bereits vorbereitete `GemeinsameStatusSicht`.

## Tests

`block8-5-ingame-hud.test.mjs` prueft mindestens:

- globale HUD-API und begrenzte Anzeige-Helfer,
- Annahme nur der explizit read-only StatusSicht,
- Ablehnung jeder Spiel-/Bedien-/Neustartautoritaet,
- Anzeige aller sieben Statusbereiche,
- bekannte `null`-, fehlende und unbekannte Werte,
- fehlende optionale Bereiche ohne Ersatzlogik,
- keine Mutation der gelieferten StatusSicht,
- fail-safe Ablehnung unvollstaendiger Runtime-/Charakterdaten,
- reine Anzeige-Modellierung auch dann, wenn kein Browser-Dokument vorhanden ist.

Der Block-8.5-Strukturguard prueft zusaetzlich statisch, dass im HUD keine Adventure-Land-Spielaktion, keine zentrale Aktionssteuerung und keine Neustartfunktion aufgerufen wird.

## Naechster Schritt

**8.5.7 – sichere Basisbedienung.**

Erst dort werden Pause, Fortsetzen und Diagnose als explizite BedienAnfragen modelliert. Jede veraendernde Bedienung muss durch die vorhandene `BedienSicherung` und die vorgesehene zentrale Laufzeit-/Aktionssteuerung laufen.
