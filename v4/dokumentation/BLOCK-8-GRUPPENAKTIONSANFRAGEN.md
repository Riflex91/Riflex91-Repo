# Block 8 – Gruppenplan zu AktionsAnfrage

Status: **standardmaessig gesperrter, read-only Uebersetzungs- und Schattenpfad**.

## Ziel

Diese Stufe schliesst die Luecke zwischen der bereits live abgenommenen Gruppenaktionsplanung und der zentralen `AktionsSteuerung`.

Die Kette lautet:

`echter Charakterzustand -> Block-7-Sicherheit -> Lebensnachweis -> Gruppenkoordination -> Gruppenaktionsplan -> GruppenAktionsAnfrage-Uebersetzung`

In dieser Stufe endet der Live-Pfad **vor** der `AktionsSteuerung`:

- keine Anfrage wird live eingereicht,
- keine Adventure-Land-Spielaktion wird ausgefuehrt,
- es existiert kein Gruppen-Ausfuehrungsadapter.

Die Integration mit der echten `AktionsSteuerung` wird ausschliesslich automatisiert getestet. Die Steuerung selbst arbeitet dort weiterhin in ihrer `SchattenAusfuehrung`.

## Drei Sicherheitsbarrieren

### 1. Standard-Lock

`erstelleGruppenAktionsAnfrageKonfiguration()` setzt standardmaessig:

```text
aktiviert: false
freigegebeneArten: []
```

Ein normaler Aufruf kann daher keine `AktionsAnfrage` erzeugen.

### 2. Explizite Arten-Whitelist

Selbst mit `aktiviert: true` werden nur Schrittarten uebersetzt, die in `freigegebeneArten` stehen.

Unterstuetzte Arten:

- `mitglied_heilen`
- `ziel_aggro_binden`
- `mitglied_schuetzen`
- `gruppe_unterstuetzen`
- `gemeinsames_ziel_bearbeiten`

Nicht freigegebene eigene Schritte werden im Ergebnis explizit unter `nichtFreigegebeneSchrittKennungen` sichtbar.

### 3. Nur der eigene Teilnehmer

Der Uebersetzer filtert strikt auf:

```text
schritt.ausfuehrenderTeilnehmerKennung === eigenerTeilnehmerKennung
```

Ein Charakter kann dadurch niemals eine Anfrage fuer einen Gruppenschritt eines anderen Charakters erzeugen.

## Aktionsnamen

Die Uebersetzung verwendet eigene, explizite Aktionsnamen:

- `GRUPPE_MITGLIED_HEILEN`
- `GRUPPE_ZIEL_AGGRO_BINDEN`
- `GRUPPE_MITGLIED_SCHUETZEN`
- `GRUPPE_UNTERSTUETZEN`
- `GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN`

Fuer diese Namen gibt es in dieser Stufe bewusst **keinen Adventure-Land-Ausfuehrungsadapter**.

## Verlustarme Uebersetzung

Eine freigegebene `AktionsAnfrage` uebernimmt aus dem Gruppenplan-Schritt:

- `wichtigkeit`,
- `prioritaet`,
- `benoetigteRessourcen`,
- `grund`,
- Schrittart und Faehigkeit,
- ausfuehrenden Teilnehmer,
- Zielart und Zielkennung.

Der Planzeitpunkt wird zu `angefordertAm`. Standardmaessig ist die Anfrage nur `1500 ms` gueltig. Eine alte Gruppensituation kann dadurch nicht beliebig spaet noch als neue Aktion gestartet werden.

## Source-Lock

`werkzeuge/block8-gruppenaktionsanfragen-kern.js` ist die Browserfassung von:

`v4/laufzeit/quelle/spiellogik/gruppen-aktionsanfragen.ts`

Der Browserkern traegt den Git-Blob-SHA der Produktionsdatei. Der Strukturguard vergleicht ihn in CI mit `git hash-object` und blockiert jede unbewusste Abweichung.

## Browser-Ladefolge

Fuer den spaeteren Zwei-Ranger-Nachweis auf jedem Charakter aus aktuellem `main` laden:

1. `v4/werkzeuge/block7-kampfsicherheits-quelle.js`
2. `v4/werkzeuge/block8-lebensnachweis-schatten.js`
3. `v4/werkzeuge/block8-gruppenkoordination-kern.js`
4. `v4/werkzeuge/block8-gruppenkoordination-schatten.js`
5. `v4/werkzeuge/block8-gruppenaktionsplanung-kern.js`
6. `v4/werkzeuge/block8-gruppenaktionsplanung-schatten.js`
7. `v4/werkzeuge/block8-gruppenaktionsanfragen-kern.js`
8. `v4/werkzeuge/block8-gruppenaktionsanfragen-schatten.js`

## Live-Nachweis A – Standard-Lock

Bei laufendem Lebensnachweis:

```js
await V4Block8GruppenAktionsAnfragen.pruefe()
```

Hat der lokale Charakter einen eigenen Gruppenplan-Schritt, wird erwartet:

```text
uebersetzung.status: "gesperrt"
uebersetzung.aktionsAnfragen: []
bereitFuerAktionsSteuerung: false
anAktionsSteuerungEingereicht: false
aktionsSteuerungVerarbeitet: false
echteSpielaktionenAusgefuehrt: false
```

## Live-Nachweis B – expliziter Support-Kandidat

Fuer das bisherige Zwei-Ranger-Testprofil besitzt `My_Ranger2` die Support-Aufgabe. Nur auf `My_Ranger2` darf fuer die Diagnose explizit ausgefuehrt werden:

```js
await V4Block8GruppenAktionsAnfragen.pruefe({
  aktiviert: true,
  freigegebeneArten: ['gruppe_unterstuetzen']
})
```

Erwartet wird genau ein Kandidat mit:

```text
aktion: "GRUPPE_UNTERSTUETZEN"
angefordertVon: "gruppen-aktionsplanung"
wichtigkeit: "normal"
prioritaet: 500
benoetigteRessourcen: ["gruppe"]
```

und weiterhin:

```text
bereitFuerAktionsSteuerung: true
anAktionsSteuerungEingereicht: false
aktionsSteuerungVerarbeitet: false
echteSpielaktionenAusgefuehrt: false
```

Auf `My_Ranger1` erzeugt dieselbe Support-Whitelist keinen Kandidaten, weil der Support-Schritt nicht ihm gehoert.

## Automatisierte Abnahme

Die Tests pruefen unter anderem:

1. Default-Lock erzeugt keine Anfrage.
2. Explizite Arten-Whitelist ist erforderlich.
3. Fremde Teilnehmer-Schritte werden nie lokal uebersetzt.
4. Wichtigkeit, Prioritaet und Ressourcen bleiben erhalten.
5. Blockierte und leere Plaene erzeugen keine Anfrage.
6. Kurze Gueltigkeit laesst alte Anfragen in der `AktionsSteuerung` ablaufen.
7. Die echte `AktionsSteuerung` akzeptiert eine freigegebene Anfrage und startet sie ausschliesslich in `SchattenAusfuehrung`.
8. Browserkern und Produktionslogik bleiben semantisch identisch.
9. Der Live-Schatten reicht selbst niemals eine Anfrage ein.
10. Keine Adventure-Land-Spielaktion wird ausgefuehrt.

## Naechster Schritt

Erst nach erfolgreichem Zwei-Ranger-Live-Nachweis dieser Stufe wird eine getrennte Integrationsstufe entworfen, die **ausgewaehlte** Anfragen tatsaechlich an die zentrale `AktionsSteuerung` einreichen darf. Auch diese Stufe bleibt zunaechst im Schattenbetrieb und erhaelt keine Adventure-Land-Ausfuehrungsadapter, bis die Ressourcen- und Safety-Abnahme abgeschlossen ist.
