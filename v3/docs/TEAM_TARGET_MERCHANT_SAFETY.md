# Team Target Authority, Melee No-Kite and Merchant Production Safety

## Purpose

This V3 safety block addresses three real-runtime failure modes observed together:

1. followers know the party leader's target but lose target state when local readiness gates fail;
2. melee classes can be pushed into kite/escape movement that takes them out of attack range;
3. Merchant Production can perform irreversible prerequisite mutations for a target that is either a net gear regression or not safely completable.

## Team target authority

The party leader's target is treated as logical team state before local combat-readiness checks.

Followers may know and retain the leader target while a later gate independently decides whether the character may:

- engage;
- regroup/follow;
- hold for potion supply;
- hold for cohesion;
- wait for local visibility.

A failed readiness gate must not be represented as `NO_SAFE_LIVE_TARGET` when an authoritative leader target is already known.

Temporary local target invisibility retains the logical target identity so the follower can continue following/regrouping until the entity is visible again.

## Melee no-kite rule

The classes below do not use combat kiting/orbit behavior:

- warrior
- paladin
- rogue

Self-aggro does not authorize the Alpha31 emergency kite fallback for these classes. This prevents movement logic from deliberately opening distance beyond melee attack range.

This rule does not disable unrelated fail-safe movement such as explicit death prevention, map recovery, or other higher-level safety systems.

## Merchant gear safety

Merchant movement speed remains strongly weighted, but speed is not allowed to override a negative total weighted gear delta.

A Merchant candidate with a speed loss is always rejected.

A Merchant candidate with a speed gain is accepted only when the normal weighted-improvement threshold is also positive.

This prevents a small speed increase from replacing materially stronger equipped gear.

## Production mutation preflight

Before an irreversible production upgrade or compound step is delegated to Alpha27, V3 verifies:

- the target gear has positive improvement evidence;
- that evidence belongs to the same production target/chain;
- remaining required farm dependencies are safely resolvable or already in a verified handoff/exchange-ready state.

If another required material has no safe acquisition path, mutation is blocked with `PRODUCTION_MUTATION_CHAIN_NOT_COMPLETABLE`.

After every mutation attempt the Merchant Production lease is released. A fresh replan must acquire a new lease before additional work proceeds.

## Regression coverage

The test suite covers:

- leader-target retention despite local potion-supply failure;
- leader-target retention while temporarily not locally visible;
- no combat kiting for warrior/paladin/rogue;
- rejection of net-negative Merchant speed gear;
- acceptance of a net-positive weighted Merchant speed upgrade;
- no irreversible mutation when another required material is unresolved;
- immediate Production lease release after a mutation attempt;
- continued event, quest, handoff and recovery behavior under the strengthened safety gate.
