# Adventure Land group-test evidence

Diese Struktur ist die kanonische, versionsuebergreifende Wissensbasis fuer reale Gruppentests des Adventure-Land-AIO-Bots.

## Ziel

Reale V3-Testlaeufe werden so dokumentiert, dass:

- verschiedene Party-Konstellationen reproduzierbar verglichen werden koennen,
- belastbare Erkenntnisse in die weitere V3-Entwicklung einfliessen,
- bestaetigte Erkenntnisse explizit als Eingabe fuer V4 erhalten bleiben,
- einzelne auffaellige Logs nicht vorschnell zu dauerhaften Regeln werden,
- Rohdaten und abgeleitete Aussagen voneinander getrennt bleiben.

## Welche Daten reichen?

### Mindestformat: GUI "Log kopieren"

Der Inhalt des GUI-Buttons **Log kopieren** ist als Eingangsdatenquelle zulaessig. Er reicht insbesondere fuer:

- Fehler und Recovery-Verhalten,
- Party-/Combat-Entscheidungen,
- zeitliche Ablaeufe,
- erkennbare Encounter-Ausgaenge,
- auffaellige Skill-, Movement-, Logistics- oder Cohesion-Probleme.

Wenn nur dieser Log vorliegt, wird die Evidence-Qualitaet entsprechend markiert. Fehlende strukturierte Kennzahlen werden nicht erfunden.

### Bevorzugt: Session-Export

Wenn moeglich zusaetzlich verwenden:

```js
AIO_V3.monitor.exportSession()
```

Der Session-Export ist fuer Gruppenvergleiche besser, weil zusammenhaengende Kontext- und Messdaten erhalten bleiben.

### Fuer tiefe Fehleranalyse: Diagnostics

Optional bei ungewoehnlichem Verhalten oder Regressionen:

```js
AIO_V3.exportDiagnostics()
```

Weitere hilfreiche Snapshots:

```js
AIO_V3.brain.status()
AIO_V3.skills.combat.adaptivePullProfiles()
```

## Datenschutz und Repository-Hygiene

Dieses Repository ist oeffentlich. Ungepruefte Rohlogs werden daher nicht standardmaessig committed.

Vor einer dauerhaften Ablage muessen insbesondere Tokens, Zugangsdaten, Cookies, Session-Informationen, private URLs und sonstige Secrets entfernt werden.

Die kanonische Langzeitablage besteht primaer aus normalisierten Testdatensaetzen und Findings. Ein bereinigter Rohlog-Auszug wird nur gespeichert, wenn er fuer Reproduzierbarkeit oder einen konkreten Fehler notwendig ist.

## Workflow

1. Testlauf in V3 durchfuehren.
2. GUI-Log kopieren; bevorzugt zusaetzlich Session-Export bereitstellen.
3. Eingangsdaten auf Secrets und unnoetige personenbezogene Daten pruefen.
4. Einen Datensatz nach `schema/group-test-v1.schema.json` erzeugen.
5. Lauf in `TEST_MATRIX.md` erfassen bzw. aktualisieren.
6. Erst nach ausreichender Evidenz eine Aussage in `FINDINGS.md` aufnehmen.
7. Jedes Finding getrennt fuer **V3-Relevanz** und **V4-Relevanz** kennzeichnen.
8. Codeaenderungen weiterhin ueber normale Branch-/PR-/Review-Pfade umsetzen.

## Evidenzstufen

- **raw**: einzelner Lauf oder reine Beobachtung; noch keine allgemeine Aussage.
- **provisional**: reproduziert oder durch mehrere Messfenster gestuetzt, aber noch nicht stabil genug.
- **confirmed**: unter vergleichbaren Bedingungen wiederholt bestaetigt und fuer Entwicklungsentscheidungen verwendbar.
- **superseded**: durch neuere Bot-Version, Content-Drift oder bessere Evidenz ueberholt.

## Wichtige Regel

Eine Party ist nicht allein aufgrund von Leveln "staerker". Bei Vergleichen muessen insbesondere Gear, Skills/Capabilities, Rollen, Encounter, Pull-Groesse, Safety und reale Performance beruecksichtigt werden. Das entspricht dem V3-Ziel, Gear als wesentlichen Progressionsfaktor zu behandeln.
