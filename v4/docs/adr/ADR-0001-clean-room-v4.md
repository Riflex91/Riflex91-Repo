# ADR-0001: V4 is a clean-room architecture beside V3

Status: accepted

V4 is developed under `v4/` without modifying or importing the V3 runtime as an implementation dependency. V3 remains the behavioral reference, regression knowledge source and production baseline while V4 is immature.

Reason: copying V3 wholesale would also copy coupling and reliability workarounds that V4 is intended to replace with stronger kernel invariants.
