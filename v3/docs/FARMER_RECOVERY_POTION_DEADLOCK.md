# Farmer Recovery Potion Deadlock

## Live failure

A low-level Warrior entered `RECOVER` at 10 / 55 MP with thousands of MP potions available.

The potion restored 300 MP, while only 45 MP were missing. The normal potion-efficiency rule therefore measured 15% utilization and rejected the potion because the configured minimum was 50%.

At the same time, the Farmer FSM could not leave `RECOVER` while MP remained below `recoverMpRatio`.

The result was a liveness deadlock:

- Warrior never left `RECOVER`;
- Warrior never selected a combat target;
- followers correctly recognized the Warrior as leader but received no leader target;
- Priest and Rogue repeatedly followed/regrouped instead of entering combat.

## Fix

Potion utilization remains an optimization outside recovery.

While the Farmer FSM is already in `RECOVER`, the utilization floor is bypassed only for the resource that is below its real recovery threshold:

- HP below `recoverHpRatio`;
- MP below `recoverMpRatio`.

This keeps ordinary potion-conservation behavior intact while preventing an efficiency optimization from blocking safety and forward progress.

## Regression

The real case is reproduced with:

- Warrior;
- 579 / 624 HP;
- 10 / 55 MP;
- MP potion restore 300;
- 50% minimum potion utilization.

The test requires the recovery state to execute `use_mp` despite only 15% utilization.

A paired test proves that the same potion remains rejected outside `RECOVER`.
