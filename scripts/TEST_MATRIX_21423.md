# v2.14.23 Merchant Liveness / Buffs / Map Test Matrix

| Case | Setup | Expected result |
| --- | --- | --- |
| Bank store ACK without state change | `bank_store` resolves but item/free/bank counts unchanged for confirmation lease | exact item identity is quarantined temporarily; no immediate resend loop |
| Quarantined first cleanup candidate | first candidate is blocked | cleanup selects another legacy-safe candidate or yields |
| Quarantine expiry | five-minute block expires | identity may be reconsidered from fresh state |
| Explicit BANK protected item | locked/special/protected item | existing protections still win; no unsafe store/sell |
| No SELL candidates | central policy has zero SELL | no forced NPC sale; unknown/valuable items remain safe |
| Bank SELL transaction active | v2.14.22 withdraw/sell state machine has tx | buff service does not interrupt it |
| Farmer has no Merchant's Luck | `mluck` absent | farmer requests renewal via CM |
| Farmer buff expiring | `mluck.ms <= lead` | farmer requests before expiry, throttled by repeat interval |
| Farmer buff healthy | `mluck.ms > lead` | no buff request |
| Merchant receives request | valid roster farmer CM | request queued with TTL |
| Farmer remote | different map / outside skill range | Merchant routes toward latest peer-report position |
| Farmer local/in range | skill available | Merchant casts through existing `useSkillSafe` / `use_skill` path |
| Buff cast pending | cast sent, report not updated | no duplicate cast while confirmation lease active |
| Buff confirmed | subsequent peer report shows materially higher remaining duration | request removed, confirmation telemetry emitted |
| Buff unconfirmed | confirmation timeout | controlled retry backoff; no spam loop |
| Invalid configured buff | skill missing or hostile | ignored; no guessed API call |
| Critical economy flight | upgrade/compound/exchange/craft active | buff service yields |
| Terrain tiles load | browser can fetch Adventure Land tiles | tile canvas + vector geometry available |
| Terrain tiles fail | cross-origin/hotlink/network failure | real `G.geometry` collision lines still render in SVG |
| Oversized terrain | tile payload omitted | compact vector geometry remains available |
| Final dashboard wrapper | later release wrappers active | terrain/map bounds/map visual are injected at final payload layer |
| Brain invariants | release update | model, confidence, weights/rewards untouched |
