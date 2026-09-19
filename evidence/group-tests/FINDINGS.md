# Group Test Findings

Hier stehen ausschliesslich verdichtete Erkenntnisse aus realen Gruppentests. Einzelne auffaellige Logs gehoeren zunaechst in einen normalisierten Run-Datensatz und nicht direkt in diese Datei.

## Findings

Noch keine realen Gruppentest-Findings kanonisiert.

## Finding-Format

Jedes neue Finding soll enthalten:

- **Finding-ID**
- **Status:** provisional / confirmed / superseded
- **Betroffene Party-Konstellationen**
- **Encounter-/Monster-Kontext**
- **Beobachtung**
- **Unterstuetzende Test-IDs**
- **Gegenbeispiele / Unsicherheit**
- **V3-Folge**
- **V4-Folge**
- **Letzte Revalidierung**

## Promotion zu confirmed

Ein Finding wird erst als `confirmed` markiert, wenn die Daten fuer die konkrete Aussage ausreichend vergleichbar sind und die Beobachtung reproduziert wurde. Ein einzelner GUI-Log kann einen wertvollen Fehlerfund belegen, reicht aber normalerweise nicht fuer eine allgemeine Aussage wie "Party A ist besser als Party B".

## V4-Uebernahme

Bestaetigte Findings werden nicht automatisch zu festen V4-Regeln. Sie dienen als empirische Anforderungen bzw. Testevidenz. V4 soll die zugrunde liegenden Zusammenhaenge moeglichst modellieren oder erneut validieren, statt historische Heuristiken blind zu uebernehmen.

## Content-Drift

Erkenntnisse, die durch Spielaenderungen, Gear-Wechsel, neue Skills oder wesentliche Bot-Aenderungen nicht mehr vergleichbar sind, werden auf `superseded` gesetzt oder erneut getestet.
