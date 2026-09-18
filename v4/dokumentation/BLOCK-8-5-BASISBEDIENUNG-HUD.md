# Block 8.5 – sichere Basisbedienung · Ingame-HUD

Status: **8.5.7 implementiert – Kern, Produktionsruntime-Grenze und sichtbarer HUD-Bedienadapter sind getrennt und abgesichert.**

## Ziel

Das bestehende read-only Ingame-HUD erhaelt genau drei kleine Bedienmoeglichkeiten:

- **Diagnose aktualisieren**
- **Pause anfordern**
- **Fortsetzen**

Die Oberflaeche darf dabei weder Adventure Land noch `AktionsSteuerung`, `LaufzeitSteuerung` oder den Produktionsheartbeat direkt bedienen.

Der vollstaendige Pfad ist:

`HUD -> Produktionsruntime-Sicherheits-API -> BasisBedienAnfrage -> SichereBasisBedienung -> BedienSicherung -> LaufzeitSteuerung / AktionsSteuerung`

## Getrenntes Modul

Die Bedienung liegt bewusst nicht im read-only HUD-Kern.

Datei:

`v4/werkzeuge/block8-5-ingame-hud-bedienung.js`

Globale API:

`V4IngameHudBedienung`

Version:

`1.0.0`

Das urspruengliche `V4IngameHud` aus Schritt 8.5.6 bleibt dadurch als rein lesende Anzeige separat verwendbar.

## Erlaubte Runtime-Methoden

Der HUD-Bedienadapter verlangt ausschliesslich:

- `basisBedienStatus()`
- `erstelleBasisBedienAnfrage(...)`
- `fuehreBasisBedienAnfrage(...)`

Er greift nicht auf andere Produktionsruntime-Methoden zur veraendernden Bedienung zu.

Insbesondere gibt es im Adapter keinen direkten Zugriff auf:

- Heartbeat-Pause/Fortsetzung,
- Runtime-Stopp,
- `LaufzeitSteuerung.pausiere()`,
- `LaufzeitSteuerung.setzeFort()`,
- `AktionsSteuerung.reicheAnfrageEin()`,
- `AktionsSteuerung.verarbeiteNaechsteAktion()`,
- Aktionsabbruch/-abschluss,
- Adventure-Land-Spielaktionen.

## Gespeicherte Laufzeit-Generation

Der Controller liest bei seiner Initialisierung den sicheren `basisBedienStatus()`.

Diese zuletzt beobachtete Generation bleibt die Grundlage fuer den naechsten veraendernden Klick.

Vor einer Pause oder Fortsetzung wird **nicht** heimlich erneut die aktuelle Generation vom Backend geholt.

Dadurch funktioniert der Stale-Schutz wirklich:

1. HUD beobachtet Generation 4.
2. Ein anderer sicherer Bedienkanal veraendert die Laufzeit zu Generation 5.
3. Das alte HUD sendet weiterhin `erwarteteLaufzeitGeneration: 4`.
4. Die Produktionsruntime rekonstruiert die kanonische Anfrage.
5. `BedienSicherung` blockiert wegen `laufzeit-generation-aktuell`.
6. Erst danach synchronisiert das HUD seinen Status.

Eine veraltete Ansicht kann damit keinen neueren Laufzeitzustand ueberschreiben.

## Diagnose aktualisieren

`Diagnose aktualisieren`:

- ist unkritisch,
- laeuft trotzdem ueber den sicheren Basisbedienungs-Anfragepfad,
- veraendert keine Laufzeit-Generation,
- kann optional nach erfolgreichem Ergebnis das vorhandene read-only HUD ueber dessen `statusLieferant` neu zeichnen.

Der Bedienadapter ruft dabei nicht selbst die V4-Fachlogik auf.

## Pause anfordern

`Pause anfordern`:

- ist eine restriktive, unkritische Bedienaktion,
- verwendet die zuletzt beobachtete Laufzeit-Generation,
- geht ueber die Produktionsruntime zur `SichereBasisBedienung`,
- laesst den Produktionsheartbeat unberuehrt,
- beendet normale/Hintergrundarbeit ueber die zentrale AktionsSteuerung,
- laesst Safety und Notfall weiterhin zu.

Nach erfolgreicher Pause ist der lokale HUD-Zustand `pausiert`.

Ein zweiter Pause-Klick wird bereits im Controller abgewiesen und erzeugt keine zweite mutierende Anfrage.

## Fortsetzen mit zwei Schritten

Fortsetzen ist absichtlich zweistufig.

### Schritt 1

Der Nutzer klickt:

**Fortsetzen**

Dieser Klick:

- fuehrt noch keine Runtime-Aenderung aus,
- erzeugt noch keine mutierende BedienAnfrage,
- zeigt die Auswirkung an:
  - neue normale/Hintergrundarbeit wird wieder freigegeben,
  - alte abgebrochene Arbeit wird nicht wiederbelebt.

### Schritt 2

Der Nutzer klickt danach explizit:

**Fortsetzen bestaetigen**

Erst jetzt erzeugt der Adapter:

- `aktion: laufzeit_fortsetzen`
- `ausdruecklichBestaetigt: true`
- die zuletzt beobachtete Laufzeit-Generation.

Auch diese Anfrage wird in der Produktionsruntime erneut kanonisch aufgebaut und durch `BedienSicherung` geprueft.

Alternativ kann der Nutzer die lokale Bestaetigungsansicht mit **Abbrechen** schliessen.

## Vorgangskennungen

Der Adapter erzeugt innerhalb des geladenen Moduls monotone Vorgangskennungen:

`v4-ingame-hud:<aktion>:<nummer>`

Der monotone Zaehler liegt auf Modulebene der `V4IngameHudBedienung`. Ein neuer Controller oder ein erneutes `montiere()` setzt ihn deshalb nicht auf 0 zurueck. Remounts koennen im selben Codekontext keine bereits vom vorherigen Controller verwendete Vorgangskennung erneut erzeugen.

Er verwendet dafuer:

- kein `Date.now()`,
- kein `Math.random()`.

Ein kompletter Seiten-/Runtime-Neustart setzt Adapter und den lokalen Idempotenzspeicher der Runtime gemeinsam zurueck.

Der Backend-Kern besitzt zusaetzlich weiterhin seinen eigenen Wiederholungsschutz ueber die Vorgangskennung.

## UI-Verhalten

Der Adapter wird in den vorhandenen HUD-Inhaltsbereich montiert und zeigt:

- aktuellen Laufzeitzustand,
- aktuelle Generation,
- Diagnose-Schaltflaeche,
- Pause-Schaltflaeche,
- Fortsetzen-Schaltflaeche,
- bei Bedarf die zweite Fortsetzen-Bestaetigung,
- normal lesbare Blockierungs-/Fehlertexte.

Waehren einer lokalen Bedienausfuehrung werden die Bedienknopfe gesperrt.

Die Schaltflaechen werden zusaetzlich anhand des zuletzt bekannten Zustands eingeschraenkt:

- Pause nur bei `laeuft`,
- Fortsetzen nur bei `pausiert`.

Diese lokale Einschraenkung ersetzt nicht die server-/runtime-seitige `BedienSicherung`.

## HUD-Schliessen

Schliessen oder Entfernen der Bediensektion:

- sendet keine Pause,
- sendet kein Fortsetzen,
- stoppt die Produktionsruntime nicht,
- veraendert keine AktionsAnfrage,
- beeinflusst den Produktionsheartbeat nicht.

Die Bediensektion ist nur Oberflaeche.

## Tests

`block8-5-ingame-hud-bedienung.test.mjs` prueft:

- begrenzte Adapter-API,
- Runtime muss genau den sicheren Basisbedienungskanal bereitstellen,
- Diagnose nur ueber Anfrage/Bedienpfad,
- Pause mit der zuletzt beobachteten Generation,
- stale Generation wird sichtbar blockiert,
- Fortsetzen erzeugt beim ersten Klick noch keine Runtime-Anfrage,
- ausdrueckliche zweite Bestaetigung fuer Fortsetzen,
- Fortsetzen ohne Bestaetigungsphase ruft die Runtime nicht auf,
- wiederholter Pause-Klick erzeugt keine zweite mutierende Anfrage,
- monotone Vorgangskennungen ohne Zufall/Uhr,
- keine identische Vorgangskennung nach neuem Controller/Remount,
- Controller bleibt ohne DOM testbar,
- kein direkter Adventure-Land-, Heartbeat-, Aktions- oder Neustartpfad.

## Ergebnis von Schritt 8.5.7

Schritt **8.5.7 ist damit vollstaendig implementiert**:

1. zentraler `LaufzeitSteuerung`-/`SichereBasisBedienung`-Kern,
2. gesicherte Produktionsruntime-Grenze,
3. schlanker HUD-Bedienadapter.

Der naechste Schritt ist **8.5.8 – Recovery-Abnahme**.
