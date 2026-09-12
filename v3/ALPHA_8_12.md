# Alpha.8.12 — Unknown Content Safety Gate

Alpha.8.12 is the first implementation block of the stability revalidation cycle. It does not add new combat power. It changes the default handling of monster types that have not previously been trusted by the persistent v3 world model.

## Safety rule

Unknown monster content is **fail-closed** for normal farming. A newly observed monster type is persisted as `QUARANTINED` before Discovery can make it a normal known world entity. Remaining visible or becoming known on later ticks does not silently remove that quarantine.

Existing monster types already present in the persistent pre-Alpha.8.12 world model are migrated once to `LEGACY_ALLOWED` so the upgrade does not unnecessarily disable previously observed farming content. This is a migration allowance, not proof that the content has completed the future long-duration stability certification.

Operators can explicitly change a monster policy through:

```js
AIO_V3.farmer.approveMonsterContent("monster_type")
AIO_V3.farmer.quarantineMonsterContent("monster_type")
```

The disposition is stored in the World Model and is therefore eligible for the existing persistence path. Status and diagnostics expose the content-safety policy under `AIO_V3.status().combatRisk.contentSafety`.

## Emergency precedence

Quarantine must never hide an immediate threat from Emergency Disengage. For the Farmer's current `ENGAGE` target, the Emergency gate evaluates the raw snapshot before Target Safety and normal Combat Risk filtering. Unknown content can therefore be refused as a farm target while still contributing to the emergency retreat path when it is already attacking the character.

## Deliberate limits

Alpha.8.12 does not autonomously approve new monsters, infer that an event boss is safe, or actively experiment against unknown content. It does not yet fingerprint changed metadata for an already-known monster type. Content drift, confidence aging, controlled exploration and automatic evidence-based promotion remain later stability/discovery work.

Default runtime mode remains `shadow`, v2 `bot.js` is untouched, and v3 remains `productionReplacement: false`.
