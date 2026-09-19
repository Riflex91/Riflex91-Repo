# Dynamic Party Roster Discovery

## Purpose

V3 must support one Merchant plus one to three supported combat characters without depending on fixed character names or a fixed class composition.

The Party Bootstrap therefore discovers the owned account roster dynamically instead of falling back to the legacy `My_Merchant + My_Ranger1 + My_Ranger2 + My_Ranger3` default.

## Trust sources

Primary account identity comes from Adventure Land's `get_characters()` result. It is used to identify owned characters, their classes and which account characters are currently online.

`get_active_characters()` remains a secondary runner/liveness source. If `get_characters()` is unavailable, it can be used only as a compatibility fallback when the local character is itself the Merchant. The fallback trusts only names actually reported by Adventure Land as active same-account runners and never invents names.

## Valid topology

A discovered live roster is valid only when it contains:

- exactly one Merchant;
- one to three combat characters;
- two to four characters total;
- only supported combat classes: warrior, paladin, rogue, ranger, mage or priest.

Duplicate combat classes and mixed class compositions are both valid.

## Fail-closed behavior

The Bootstrap performs no party action while account identity is incomplete, ambiguous or unsupported.

Examples include:

- Merchant not yet online;
- no combat character online;
- more than four active account characters;
- multiple online Merchants;
- an unsupported online class;
- a dynamic roster change while a prior Bootstrap operation is still in flight.

A valid account roster must remain stable for the configured settle window before becoming authoritative.

## Reconvergence

When the online account roster changes, the Bootstrap reconverges to the new validated roster. Trust configuration, Merchant identity, pending Bootstrap attempts and CharacterRegistry seed data are updated only after validation.

The CharacterRegistry is seeded with the validated names, classes and online state so each local runner can reason about the whole team even when its own `get_active_characters()` view contains only itself.

## Regression scenario

The live issue that motivated this change is covered explicitly:

`My_Merchant + My_Mage + My_Warrior + My_Rogue`

Each simulated runner may see only itself through `get_active_characters()`, while `get_characters()` exposes the owned account roster. All four runners must converge on the same trusted roster and must not classify Mage, Warrior or Rogue as foreign characters.
