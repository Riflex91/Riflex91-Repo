# v2.14.22 Auto-Economy Test Matrix

| Case | Setup | Expected result |
| --- | --- | --- |
| Full inventory | free slots <= emergency threshold | SELL candidates first; otherwise BANK; no destructive fallback |
| Empty bank | bank available with free slots | safe BANK items stored; no withdrawal sale |
| Full bank | no free bank slot | explicit/safe SELL bank candidate may enter withdraw→sell state machine |
| Full bank, no safe candidate | all items protected/unknown/rare/reserved | no item withdrawn or sold; existing bank-unlock/recovery logic remains authoritative |
| Protected item | configured protected/keep item | KEEP; never sell/upgrade/compound |
| Locked item | `l` set | KEEP |
| Special item | `p` set | KEEP |
| Unknown item definition | missing from game item table | KEEP |
| High NPC value | value >= configured threshold | KEEP unless future policy explicitly narrows protection safely |
| Explicit SELL | item rule SELL and surplus above reserve | SELL; pre-sale policy revalidated |
| Explicit SELL in bank | bank item SELL and inventory slot free | withdraw, confirm, vendor travel, sell, confirm |
| Bank slot changes | item moves between plan and withdrawal | RECOVER; no second withdraw |
| Item moves before sale | withdrawn item no longer at expected identity | re-find exact identity or RECOVER |
| Sale unconfirmed | inventory quantity does not drop in lease | RECOVER; no repeated sale loop |
| Withdraw unconfirmed | bank/inventory counts do not change in lease | RECOVER; no repeated withdraw loop |
| Compound 3 identical items | same name + same level + safe policy | compound only after economics and live-slot revalidation |
| Compound not profitable | e.g. 3×20,000 current value → 2,000 result | skip compound; items remain eligible for safe sell/bank policy |
| Missing compound scroll | no cscroll available | existing scroll acquisition path runs; no compound call |
| Upgrade target reached | current level >= target | no upgrade |
| Missing upgrade scroll | no scroll available | existing scroll acquisition path runs; no upgrade call |
| Not enough reserve gold | scroll purchase would breach reserve | no scroll purchase/action |
| Upgrade slot changed | item differs before API call | abort with `upgrade_slot_changed` |
| Compound slot changed | any of three slots differs before API call | abort with `compound_slot_changed` |
| Character dies mid-economy | `character.rip` becomes true | RECOVER; no economic action continues |
| Movement active | movement/route lock in flight | economy waits; no critical action starts |
| Existing bank cleanup active | v2.14.8/15 cleanup state active | new bank-sale transaction does not start |
| Existing bank retrieve active | warehouse retrieve state active | new bank-sale transaction does not start |
| Upgrade/compound/exchange/craft flight active | Adventure Land action queue active | new critical economy action does not start |
| RECYCLE/DISCARD policy | explicit unsupported action | safe KEEP fallback; no guessed game API called |
| Planner cache | unchanged inventory within plan interval | cached plan reused |
| Planner dirty state | inventory signature changes | plan rebuilt |
| Logging | repeated same message | throttled; no per-tick spam |
