# Block 8 – read-only Lebensnachweis-Austausch

## Ziel

Dieser Schritt verbindet das Block-8-Gruppenfundament mit echten Adventure-Land-Charakteren, ohne Kampf-, Bewegungs-, Skill-, Heil-, Loot-, Handels- oder Party-Aktionen auszufuehren.

Der Austausch verwendet ausschliesslich adressierte `send_cm`-Nachrichten zwischen explizit vertrauten Charakternamen. `command_character` wird absichtlich nicht verwendet.

## Runtime

`erstelleGruppenTeilnehmerMeldungAusSpielzustand(...)` erzeugt einen `GruppenTeilnehmerMeldung` direkt aus einem V4-`Spielzustand`.

Verbindliche Identitaets- und Weltwerte werden nicht geraten. Fehlen Charakterkennung, Charaktername, Klasse, Serverregion, Serverkennung, Karte oder Instanz, ist das Ergebnis `blockiert` und es wird keine Meldung erzeugt.

HP-/MP-Anteile duerfen dagegen `null` bleiben, wenn Adventure Land diese Werte nicht sicher liefert. Zeit und Sequenz stammen deterministisch aus `spielzustand.aufgenommenAm` und `spielzustand.laufendeNummer`.

`AdventureLandGruppenLebensnachweisAustausch` liegt an der Ausfuehrungsgrenze. Senden ist standardmaessig gesperrt und muss explizit freigegeben werden. Ziele ausserhalb der Vertrauensliste werden vor `send_cm` blockiert.

Adventure Land trennt den Charakter-Codekontext von Spiel-Funktionen, die je nach Laufumgebung im Parent-Kontext liegen koennen. Deshalb gilt fuer den Lebensnachweis verbindlich:

- `on_cm` wird im lokalen Charakter-Codekontext installiert,
- `send_cm` darf lokal oder im Parent-Kontext gefunden werden,
- der Parent-`on_cm` wird nicht als Ersatz fuer den lokalen Empfang verwendet.

Diese Trennung entspricht dem bewaehrten v3-Transportmodell und verhindert den Fehlerzustand `gesendet > 0`, `empfangen = 0`, obwohl der Empfaenger scheinbar installiert ist.

Eingehende V4-Umschlaege werden nur akzeptiert, wenn:

- der Absender in der Vertrauensliste steht,
- der Adventure-Land-Absendername dem Umschlag-Absender entspricht,
- `meldung.charakterName` demselben Absender entspricht,
- der Umschlag das Protokoll `v4-gruppen-lebensnachweis-v1` verwendet.

Nicht-V4-`on_cm`-Nachrichten werden an einen bereits vorhandenen lokalen Empfaenger weitergereicht.

## Mehrcharakter-Schattennachweis

Werkzeug:

```text
v4/werkzeuge/block8-lebensnachweis-schatten.js
```

Das Werkzeug wird in mindestens zwei eigenen Adventure-Land-Charakterkontexten geladen. Auf allen beteiligten Charakteren muss dieselbe Vertrauensliste konfiguriert werden.

Beispiel fuer einen Schadenscharakter:

```js
V4Block8Lebensnachweis.konfiguriere({
  vertrauensNamen: ["CharA", "CharB"],
  faehigkeiten: {
    heilen: 0,
    schaden: 1,
    aggro: 0,
    schutz: 0,
    unterstuetzung: 0
  },
  gefahrenStufe: "unbekannt",
  intervallMillisekunden: 1000
})
```

Danach auf jedem beteiligten Charakter:

```js
await V4Block8Lebensnachweis.starte()
```

Status:

```js
V4Block8Lebensnachweis.status()
```

Stoppen:

```js
V4Block8Lebensnachweis.stoppe()
```

## Erwarteter Nachweis

Nach einigen Sekunden sollen auf jedem beteiligten Charakter gelten:

- `aktiv: true`
- `gesendet > 0`
- `empfangen > 0`
- `verworfen: 0` bei sauberem Test
- `empfangsKontext: "lokaler_codekontext"`
- `sendeKontext: "lokal"` oder `"parent"`
- mindestens ein fremder Eintrag in `teilnehmer`
- fallendes bzw. regelmaessig erneuertes `alterMillisekunden`
- `echteSpielaktionenAusgefuehrt: false`
- `kommunikation: "send_cm"`

Der Austausch darf weder `attack`, `move`, `smart_move`, `use_skill`, `use_hp`, `use_mp`, `loot`, `send_party_invite` noch `command_character` aufrufen.

## Wiederholung nach einem alten Werkzeuglauf

Vor dem Laden einer korrigierten Werkzeugversion einen noch laufenden alten Austausch auf jedem Charakter zuerst stoppen:

```js
V4Block8Lebensnachweis.stoppe()
```

Danach die neue Datei laden, erneut konfigurieren und starten. So werden alter Timer und alter `on_cm`-Empfaenger sauber entfernt.

## Reconnect-/Stale-Verhalten

Wird ein beteiligter Charakter oder dessen Werkzeug gestoppt, steigt das Alter des letzten empfangenen Lebensnachweises. Die bereits gemergte Gruppenkoordination stuft Meldungen oberhalb von `lebensnachweisMaximalAlterMillisekunden` als `veraltet` ein und verteilt Aufgaben auf verbleibende aktive Teilnehmer neu.

Nach Neustart liefert der Charakter wieder Meldungen mit neuerem `gesendetAm` und hoeherer `laufendeNummer`; die Koordination kann ihn dadurch wieder aufnehmen.

## Sicherheitsgrenze

Dieser Nachweis testet Transport und Lebenszeichen. Eine konfigurierte `gefahrenStufe` ist dabei nur ein expliziter Testwert. Fuer spaetere autonome Gruppenarbeit muss sie aus der Block-7-Kampfsicherheitsentscheidung des jeweiligen Charakters kommen. Bei `unbekannt` bleibt normale Gruppenarbeit gemaess Block-8-Fundament fail-safe blockiert.
