# ADR-0003: Replay is a foundation capability

Status: accepted

Runtime decisions must be driven from serializable inputs wherever practical. Incident evidence is sealed into replay bundles so bugs can be reproduced and candidate changes can be compared against historical inputs without requiring a live character.

Wall-clock access, random values and external responses must be abstracted or recorded when they can influence decisions.
