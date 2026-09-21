# ADR-033 – Durable produktive Einmal-Authority fuer equipment.equip

**Status:** RATIFIZIERT  
**Datum:** 2026-09-20

## Kontext

ADR-032 registriert `equipment.equip` als einzige produktive
`MUTIEREN`-Capability, laesst sie aber absichtlich inaktiv. Fuer den
spaeteren produktiven Equip-Nachweis wird eine Authority benoetigt, die
weder eine allgemeine MUTIEREN-Aktivierung einfuehrt noch den R12-Testgate
wiederverwendet.

## Entscheidung

1. `equipment.equip` bleibt im `FaehigkeitsRegister` jederzeit
   `aktiv=false`.
2. Die Produktionsruntime kann stattdessen exakt eine kurzlebige
   `ProduktiveEquipEinmalAuthority` ausstellen.
3. Die Authority ist exakt gebunden an:
   - `equipment.equip`;
   - `equipment-core@1`;
   - `AL-ACTION-EQUIP`;
   - `AL-RECOVERY-EQUIP`;
   - `AL-VERIFIER-EQUIP`;
   - eine konkrete Aktivierungs-ID;
   - eine konkrete Transaktions-ID;
   - Policy `EQUIPMENT-EQUIP-PRODUKTION-EINMAL-V1`.
4. Die explizite Einmal-Bestaetigung lautet exakt
   `V5 EQUIP EINMAL AUSFUEHREN`.
5. Die Authority lebt maximal 2000 ms und wird durch die erste erfolgreiche
   Capability-Pruefung fuer Admission verbraucht.
6. Vor Ausstellung wird
   `EQUIP_EINMAL_AUTHORITY_VOR_WIRKUNG` exklusiv durable gespeichert.
7. Nach dem Durable-Write werden Runtime, Operator-Policy, Provider,
   Capability und Health/Operations erneut validiert.
8. Persistenzfehler, ID-Kollisionen oder ungueltige Durable-Bestaetigungen
   blockieren fail-closed.
9. Host-Start muss zuvor die bestehende produktive Gesamtfreigabe passiert
   haben. Die Authority-Anfrage verwendet frisch durch den Host erhobene
   Health-/Operations-Evidence.
10. Aktive PLANEN-Capabilities und eine Equip-Einmal-Authority duerfen im
    ersten produktiven Mutationspfad nicht gleichzeitig bestehen.
11. Stop, NOTHALT, Capability-Deny oder Health-/Operations-Verlust widerrufen
    eine noch offene Authority.
12. Die Ausstellung selbst fuehrt keinen Gameplay-Write und keinen
    Adapter-Send aus.

## Alternativen

- Die MUTIEREN-Capability dauerhaft im Register aktivieren: verworfen, weil
  dies die Authority-Lebensdauer unnoetig vergroessert.
- Eine generische `aktiviereMutierend`-API einfuehren: verworfen, weil sie
  spaetere Capabilities implizit autorisieren koennte.
- Den R12-`EinmaligesR12ControlledLiveGate` wiederverwenden: verworfen,
  weil dieser Gate laut ADR-014 ausschliesslich Test-Authority ist.
- Die Authority nur im RAM ohne Durable-Evidence erzeugen: verworfen, weil
  Authority vor Wirkung nachvollziehbar und kollisionssicher persistiert
  sein muss.

## Konsequenzen

- Die produktive Host-Fassade erhaelt nur einen exakt benannten
  `erteileEquipEinmalAuthority`-Pfad, keine generische Mutation-Aktivierung.
- Die Runtime kann weiterhin `aktiveMutierendeFaehigkeiten=0` melden.
- Ein Prozessneustart rekonstruiert keine alte Einmal-Authority.
- Der naechste Schritt muss Admission, Ressourcen/Fencing, Action-Channel,
  Socket-Budget, durable Mutation-Intent, Adapter-Send und Recovery zu einer
  einzigen produktiven Equip-Transaktion zusammensetzen.
- Bis zu diesem naechsten Schritt kann diese Authority allein keinen
  Gameplay-Zustand veraendern.

## Invarianten

- exakt `equipment.equip` / `equipment-core@1`;
- exakt eine Verwendung;
- maximal 2000 ms Lebensdauer;
- explizite exakte Einmal-Bestaetigung;
- durable Evidence vor Authority-Ausstellung;
- Revalidierung nach dem Durable-Write;
- Registry-Capability bleibt inaktiv;
- keine parallele PLANEN-Authority im Host;
- keine generische MUTIEREN-Aktivierung;
- keine Gameplay-Wirkung durch Authority-Ausstellung.

## Migration

Die Node-Produktionskomposition injiziert ein eigenes
`NodeEquipEinmalAuthorityProtokoll`. Vorhandene PLANEN-Authority und
deny-only Operator-Semantik bleiben unveraendert.

Es ist noch kein neuer Ingame-Test erforderlich. Erst die folgende
Execution-Orchestrierung darf einen kontrollierten realen Equip-Send
vorbereiten.

## Rollback

Rollback entfernt Authority-Klasse, Runtime-/Host-Methode und das
Authority-Protokoll. Bereits geschriebene Auditdateien sind reine Evidence
und erteilen nach Restart keine Authority.
