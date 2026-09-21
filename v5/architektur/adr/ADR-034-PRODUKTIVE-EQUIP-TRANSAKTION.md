# ADR-034 – Produktive Einmal-Equip-Transaktion

**Status:** RATIFIZIERT  
**Datum:** 2026-09-21

## Kontext

ADR-032 registriert `equipment.equip` default-off. ADR-033 fuehrt eine
durable, kurzlebige Einmal-Authority ein, die allein noch keinen Gameplay-Write
ausfuehrt. Fuer den ersten echten produktiven Mutationsnachweis fehlt damit nur
noch die geschlossene Kette aus Admission, Ressourcen/Fencing, Socket-Budget,
durable Mutation-Intent, exakt einem Adapter-Send und Postcondition/Recovery.

Die bereits vorhandenen R12/R19-Live-Nachweise zeigen, dass der
`AL-ACTION-EQUIP`-/`AL-RECOVERY-EQUIP`-/`AL-VERIFIER-EQUIP`-Vertrag
real funktioniert. Deren Testgates duerfen jedoch nicht als produktive
Authority wiederverwendet werden.

## Entscheidung

1. Die erste produktive Mutation bleibt exakt `equipment.equip` mit Owner
   `equipment-core@1`.
2. Die kanonische Node-Host-Fassade erhaelt exakt
   `fuehreEquipEinmalTransaktion(...)`; es entsteht keine generische
   MUTIEREN-Ausfuehrungs-API.
3. Vor der Authority-Ausstellung muss das produktive Transaktionsjournal
   bestaetigen, dass keine alte offene Equip-Transaktion existiert.
4. Unmittelbar vor der Authority-Ausstellung wird der Host mit frischer
   Operations-/Health-Evidence getickt.
5. Admission verwendet den bestehenden generischen
   `ErteilteAusfuehrungsFreigabe`-Pfad und erzwingt:
   - produktive Gesamtfreigabe;
   - laufenden Host;
   - keine aktive PLANEN-Capability;
   - offene, exakt transaktionsgebundene Equip-Einmal-Authority;
   - deny-only Operator-Recheck;
   - exakt `AL-ACTION-EQUIP` / `AL-RECOVERY-EQUIP` /
     `AL-VERIFIER-EQUIP`;
   - die sechs bestehenden R9-Invarianten;
   - Fencing fuer character-spezifisches Equipment und Inventory;
   - den character-spezifischen Action-Channel `equip`;
   - Socket-Budget-Kosten 3;
   - durable Mutation-Intent vor dem Send;
   - frische Live-Preconditions.
6. Der erste produktive Live-Kandidat muss ein Merchant sein und ein
   unlocked Nicht-Waffen-Item in einen **leeren** sicheren Equipment-Slot
   equippen. Ein Swap eines bereits belegten Slots ist fuer diesen Nachweis
   verboten.
7. Der Produktionsadapter besitzt genau einen moeglichen Gameplay-Write:
   `root.equip(index, slot)`.
8. Der Adapter kann pro Instanz maximal einmal aufgerufen werden.
9. Drift unmittelbar vor dem Write liefert `NICHT_GESENDET`.
10. Ein unerwarteter Adapterfehler wird als `UNBEKANNT` behandelt und ueber
    Recovery beobachtet; Same-Intent-Retry bleibt immer verboten.
11. Recovery beobachtet bounded maximal viermal und verifiziert Equipment und
    Inventory. Nur `BESTAETIGT` fuehrt zu `COMMIT`.
12. Nicht gesendete Aktionen enden durable in `ABBRUCH`. Unklare,
    teilweise oder fail-safe Situationen enden ohne Retry in
    `SICHER_FEHLGESCHLAGEN` oder benoetigen Operator-Aufmerksamkeit.
13. Das Produktionsjournal besitzt einen globalen Current-Pointer. Eine
    nicht terminale alte Transaktion blockiert jeden neuen Equip-Intent.
14. Der Preflight-Modus ist read-only und prueft Host sowie sicheren Kandidaten
    ohne Gameplay-Write.
15. Der Live-Modus verlangt exakt
    `V5 EQUIP EINMAL AUSFUEHREN` und eine 40-stellige Source-SHA.
16. Der Abschlussbericht wird durable unter
    `D:\AdventureLand-V5\runtime\canary\equipment-equip-production\latest.json`
    geschrieben.

## Alternativen

- Den alten R12-Controlled-Live-Runner produktiv verwenden: verworfen, weil
  dessen Owner und Gate ausdruecklich Test-Authority sind.
- Equip in einen belegten Slot zulassen: verworfen fuer den ersten
  Produktionsnachweis, weil ein Swap eine komplexere Postcondition erzeugt.
- Direkt aus dem Host `equip()` aufrufen: verworfen, weil Admission,
  Fencing, Budget, Intent und Recovery umgangen wuerden.
- Adapterfehler automatisch erneut senden: verworfen, weil nach moeglichem
  Send ein Duplicate-Effekt nicht ausgeschlossen werden kann.
- Offene Crash-Transaktionen automatisch verwerfen: verworfen; ungeklaerte
  Zustandsgrenzen muessen fail-closed bleiben.

## Konsequenzen

- Nach gruenem Exact-Head-CI ist der naechste technisch notwendige Schritt ein
  manueller Ingame-Preflight und danach genau ein bestaetigter Equip-Write.
- Der Benutzer muss einen eingeloggten Merchant in sicherem Ruhezustand,
  mindestens einen leeren unterstuetzten Slot und ein passendes unlocked
  Nicht-Waffen-Item im Inventar bereitstellen.
- Ein fehlender Kandidat fuehrt nur zu einem read-only Blocker.
- Ein erfolgreicher Live-Test schreibt genau einen Gameplay-Write und darf
  nicht automatisch wiederholt werden.
- Bank-, Trade-, Transfer-, Upgrade-, Compound-, Exchange- und Craft-
  Mutationen bleiben von diesem ADR unberuehrt.

## Invarianten

- exakt `equipment.equip` / `equipment-core@1`;
- Registry-Capability bleibt default-off;
- exakte Einmal-Authority;
- exakte Operator-Bestaetigung;
- leerer Zielslot;
- kein Waffen-Slot;
- unlocked Item;
- durable Intent vor Send;
- Fencing fuer Equipment, Inventory und Action-Channel;
- Socket-Budget vor Send;
- maximal ein Adapteraufruf;
- maximal ein Gameplay-Write;
- Same-Intent-Retry immer false;
- Recovery bounded und postcondition-basiert;
- offene Crash-Transaktion blockiert;
- keine generische MUTIEREN-API;
- keine breite Runtime-Freigabe durch diese Transaktion.

## Migration

Die Node-Produktionskomposition erhaelt intern das
`NodeEquipTransaktionsJournal`, den bestehenden Runtime-Ressourcen-/Budget-
Kern sowie die produktive Equip-Orchestrierung. Diese internen Objekte werden
nicht ueber die Fassade exponiert.

Die npm-Kommandos sind:

`npm run equipment-equip-production:preflight -- --cdp http://127.0.0.1:9222/`

und nach erfolgreichem Preflight mit expliziter Bestaetigung:

`npm run equipment-equip-production:live -- --cdp http://127.0.0.1:9222/ --source-sha <40-HEX> --confirm "V5 EQUIP EINMAL AUSFUEHREN"`

## Rollback

Vor einem realen Write ist Rollback gameplay-neutral. Nach einem realen
Write muss die durable Transaktions-Evidence erhalten bleiben. Ein Rollback
darf eine offene oder ungeklaerte Transaktion nicht aus dem Current-Pointer
entfernen und keinen Same-Intent-Retry ermoeglichen.
