# ADR-0002: Features emit intents; the kernel owns execution resources

Status: accepted

Feature modules do not directly execute Adventure Land actions. They emit intents. The kernel arbitrates intent priority and atomically grants exclusive resources before the executor may act.

Initial resource names: movement, inventory, bank, economy, combatTarget, party, equipment.

This design is intended to prevent the V1-V3 class of bugs where individually valid subsystems issue conflicting movement/inventory/economy actions.
