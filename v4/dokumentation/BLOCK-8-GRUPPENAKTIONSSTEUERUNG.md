# Block 8 – Gruppen-AktionsAnfragen in die zentrale AktionsSteuerung

Status: **doppelt gesperrter Integrations- und Live-Schattenpfad**.

## Ziel

Diese Stufe fuehrt die bereits live abgenommene Gruppenaktionsanfrage in die zentrale `AktionsSteuerung` ein. Die zentrale Steuerung verarbeitet weiterhin ausschliesslich `SchattenAusfuehrung`.

Die Kette lautet:

`Spielzustand -> Block-7-Sicherheit -> Lebensnachweis -> Gruppenkoordination -> Gruppenaktionsplan -> AktionsAnfrage-Kandidat -> zentrale AktionsSteuerung -> SchattenAusfuehrung`

Es existiert weiterhin **kein Adventure-Land-Ausfuehrungsadapter** fuer `GRUPPE_*`-Aktionen.

## Zwei unabhaengige Freigaben

### 1. Kandidat erzeugen

Die bestehende Gruppenaktionsanfrage-Uebersetzung bleibt standardmaessig gesperrt:

```text
uebersetzungAktiviert: false
freigegebeneArten: []
```

### 2. Kandidat einreichen

Auch ein bereits erzeugter Kandidat wird standardmaessig **nicht** an die zentrale Steuerung uebergeben:

```text
einreichungAktiviert: false
freigegebeneAktionen: []
verarbeiten: false
```

Damit reicht eine versehentliche Freigabe der ersten Stufe nicht aus, um die Steuerung zu erreichen.

## Produktionslogik

`v4/laufzeit/quelle/spiellogik/gruppen-aktionssteuerung.ts`

stellt bereit:

- `erstelleGruppenAktionsSteuerungKonfiguration(...)`
- `uebergibGruppenAktionsAnfragenAnSteuerung(...)`

Die Logik:

1. validiert einen expliziten `jetzt`-Zeitpunkt,
2. blockiert standardmaessig,
3. verlangt eine zweite Whitelist auf `GRUPPE_*`-Aktionsnamen,
4. verwirft abgelaufene Anfragen **vor** `reicheAnfrageEin(...)`,
5. reicht nur noch gueltige und freigegebene Anfragen ein,
6. ruft `verarbeiteNaechsteAktion(jetzt)` nur bei `verarbeiten: true` auf,
7. bricht alte wartende, blockierte oder laufende Gruppenarbeit fail-safe ab, wenn die aktuelle Gruppenplanung `blockiert` oder lokal `leer` ist,
8. laesst andere zentrale Arbeit sowie reine Freigabesperren von diesem Safety-Abbruch unberuehrt,
9. gibt Laufzustaende und Schattenprotokoll explizit zurueck.

## Zentrale Browser-Steuerung

`v4/werkzeuge/aktions-steuerung-schatten-kern.js`

ist eine browserfaehige Fassung der zentralen Steuerungslogik und ist per Git-Blob-SHA an folgende Produktionsquellen gebunden:

- `kern/aktions-steuerung.ts`
- `kern/laufzeit-steuerung.ts`
- `vertraege/laufzeit-steuerung.ts`
- `kern/aktions-auswahl.ts`
- `kern/ressourcen-vergabe.ts`
- `kern/schatten-ausfuehrung.ts`
- `vertraege/ressourcen-sperre.ts`

CI vergleicht das Verhalten gegen die echte Produktionsklasse fuer Start, Ablauf, Ressourcenblockierung, Unterbrechung durch wichtigere Anfragen sowie die zentrale Laufzeit-Pause. Der Browserkern spiegelt dabei nur Schattenzustand; auch waehrend der Pause werden keine echten Adventure-Land-Aktionen eingefuehrt.

## Gruppen-Integrationskern im Browser

`v4/werkzeuge/block8-gruppenaktionssteuerung-kern.js`

ist source-locked an:

`v4/laufzeit/quelle/spiellogik/gruppen-aktionssteuerung.ts`

und bildet die Produktionsfunktion fuer den Browser nach.

## Diagnosebereinigung

Der beim Live-Test beobachtete Konsoleneintrag

```text
"nichtFreigegebeneSchrittKennungen": "[Zirkulaere Referenz]"
```

entstand durch dieselbe Array-Referenz fuer `eigeneSchrittKennungen` und `nichtFreigegebeneSchrittKennungen`.

Der Default-Lock erzeugt jetzt zwei getrennte eingefrorene Arrays mit identischem Inhalt. Ein Regressionstest stellt sicher, dass beide Werte semantisch gleich, aber nicht referenzidentisch sind.

## Browser-Ladefolge

Auf dem Testcharakter aus aktuellem `main` laden:

1. `v4/werkzeuge/block7-kampfsicherheits-quelle.js`
2. `v4/werkzeuge/block8-lebensnachweis-schatten.js`
3. `v4/werkzeuge/block8-gruppenkoordination-kern.js`
4. `v4/werkzeuge/block8-gruppenkoordination-schatten.js`
5. `v4/werkzeuge/block8-gruppenaktionsplanung-kern.js`
6. `v4/werkzeuge/block8-gruppenaktionsplanung-schatten.js`
7. `v4/werkzeuge/block8-gruppenaktionsanfragen-kern.js`
8. `v4/werkzeuge/block8-gruppenaktionsanfragen-schatten.js`
9. `v4/werkzeuge/aktions-steuerung-schatten-kern.js`
10. `v4/werkzeuge/block8-gruppenaktionssteuerung-kern.js`
11. `v4/werkzeuge/block8-gruppenaktionssteuerung-schatten.js`

## Live-Nachweis A – zweite Sperre

Auf `My_Ranger2`, solange der Support-Schritt vorhanden ist:

```js
await V4Block8GruppenAktionsSteuerung.pruefe({
  uebersetzungAktiviert: true,
  freigegebeneArten: ['gruppe_unterstuetzen']
})
```

Erwartung:

```text
anfragenAuswertung.uebersetzung.status: "erzeugt"
steuerungsErgebnis.status: "gesperrt"
anAktionsSteuerungEingereicht: false
aktionsSteuerungVerarbeitet: false
echteSpielaktionenAusgefuehrt: false
```

## Live-Nachweis B – einreihen, noch nicht verarbeiten

Zuerst zentrale Testinstanz leeren:

```js
V4Block8GruppenAktionsSteuerung.setzeSteuerungZurueck()
```

Dann:

```js
await V4Block8GruppenAktionsSteuerung.pruefe({
  uebersetzungAktiviert: true,
  freigegebeneArten: ['gruppe_unterstuetzen'],
  einreichungAktiviert: true,
  freigegebeneAktionen: ['GRUPPE_UNTERSTUETZEN'],
  verarbeiten: false
})
```

Erwartung:

```text
steuerungsErgebnis.status: "eingereiht"
laufZustaende[0].phase: "wartend"
schattenEintraege: []
anAktionsSteuerungEingereicht: true
aktionsSteuerungVerarbeitet: false
echteSpielaktionenAusgefuehrt: false
```

## Live-Nachweis C – zentrale Schattenverarbeitung

Wieder zuerst:

```js
V4Block8GruppenAktionsSteuerung.setzeSteuerungZurueck()
```

Dann:

```js
await V4Block8GruppenAktionsSteuerung.pruefe({
  uebersetzungAktiviert: true,
  freigegebeneArten: ['gruppe_unterstuetzen'],
  einreichungAktiviert: true,
  freigegebeneAktionen: ['GRUPPE_UNTERSTUETZEN'],
  verarbeiten: true
})
```

Erwartung:

```text
steuerungsErgebnis.status: "verarbeitet"
steuerungsErgebnis.verarbeitung.art: "gestartet"
steuerungsErgebnis.verarbeitung.gestarteteAnfrage.aktion: "GRUPPE_UNTERSTUETZEN"
laufZustaende[0].phase: "laeuft"
schattenEintraege.length: 1
schattenEintraege[0].phase: "laeuft"
ressourcenSperren: Ressource "gruppe" gehoert der Gruppen-AktionsAnfrage
anAktionsSteuerungEingereicht: true
aktionsSteuerungVerarbeitet: true
echteSpielaktionenAusgefuehrt: false
```

## Sicherheitsgrenze

Auch bei Nachweis C wird nur der zentrale Schattenzustand veraendert. Die Browserkerne und der Live-Schatten enthalten keine Aufrufe an `attack`, `move`, `smart_move`, `use_skill`, `use_hp`, `use_mp`, `loot`, `command_character` oder `send_party_invite`.

## Abschluss

Die zentrale Schattenstufe sowie die Abschluss-Haertung fuer Ressourcenblockierung, Preemption, Expiry, Plan-Invalidierung und fail-safe Neustart sind bestanden. Die aktive one-shot Freigabekampagne und der anschliessende 10-Minuten-Gruppentest sind ebenfalls bestanden.

Der formale Block-8-Abschluss steht in `BLOCK-8-ABSCHLUSS.md`. Weitere Laufzeitfaehigkeiten folgen erst nach den fuer Block 8.5 definierten Freigabestufen.
