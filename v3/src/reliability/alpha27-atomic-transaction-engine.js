'use strict';

const { finite, clone, text, levelOf, inventoryOf, characterOf, gameDataOf, identityQuantity, findItem, gradeForLevel, transactionInputs, rawFunction } = require('./alpha27-utils');
const { CONTROLLED_ACK, SUPERVISOR_ALLOWED, EXPECTED_DISPOSITIONS } = require('./alpha27-atomic-constants');
const { Alpha27AtomicLedger } = require('./alpha27-atomic-ledger');

class Alpha27AtomicTransactionEngine extends Alpha27AtomicLedger {
  targetedGearCompoundInputAllowed(entry, metadata = {}, index = null) {
    if (!entry || metadata.targetedGearFinalization !== true || metadata.lifecycle !== 'FARMER_GEAR_DELIVERY_FINALIZATION') return false;
    if (String(entry.name || '') !== String(metadata.deliveryItem || '')) return false;
    const disposition = String(entry.disposition || '');
    if (disposition === 'RESERVE_COMPOUND') return true;

    const reasons = Array.isArray(entry.reasons) ? entry.reasons.map(String) : [];
    if (disposition === 'RESERVE_PROGRESSION') {
      if (Number(index) !== Number(metadata.progressionInputIndex)) return false;
      const goalId = metadata.goalId == null ? null : String(metadata.goalId);
      const reservedGoalIds = entry.reservation && Array.isArray(entry.reservation.goalIds)
        ? entry.reservation.goalIds.map(String)
        : [];
      return !!goalId && reservedGoalIds.includes(goalId);
    }
    if (disposition === 'KEEP') {
      return reasons.includes('AUTONOMOUS_COMPOUND_ACCUMULATION')
        && !reasons.includes('FUTURE_FARMER_GEAR_PROGRESSION');
    }
    if (disposition === 'SELL') {
      return reasons.includes('AUTONOMOUS_COMPOUND_RESULT')
        && reasons.includes('FUTURE_FARMER_GEAR_EVALUATED_SAFE');
    }
    return false;
  }

  patchTransactionEngine() {
    const engine = this.runtime.transactionEngine;
    if (!engine || engine.__alpha27AtomicPatched) return false;
    const baseRelease = typeof engine._release === 'function' ? engine._release.bind(engine) : null;
    engine._release = (row) => {
      const keys = new Set([...(Array.isArray(row && row.reservationKeys) ? row.reservationKeys : []), row && row.reservationKey].filter(Boolean).map(String));
      for (const key of keys) if (engine.reservations && engine.reservations.get(key) === row.id) engine.reservations.delete(key);
      if (baseRelease) baseRelease(row);
    };

    engine.planAtomic = (request = {}, context = {}) => {
      const type = String(request.type || '').toUpperCase();
      if (!['UPGRADE', 'COMPOUND'].includes(type)) return engine.plan(request, context);
      if (engine.breaker(type).open) return engine._reject('TRANSACTION_CIRCUIT_OPEN', { type });
      const character = text(request.character);
      const indices = [...new Set((Array.isArray(request.indices) ? request.indices : [request.index]).map(Number))];
      if (!character || indices.some((index) => !Number.isInteger(index) || index < 0)) return engine._reject('INVALID_ITEM_REFERENCE', { type, character, indices });
      if (type === 'UPGRADE' && indices.length !== 1) return engine._reject('UPGRADE_REQUIRES_ONE_INPUT', { indices });
      if (type === 'COMPOUND' && indices.length !== 3) return engine._reject('COMPOUND_REQUIRES_THREE_INPUTS', { indices });
      const ledger = context.ledger || this.runtime.inventoryLedger;
      const ledgerStatus = ledger && typeof ledger.status === 'function' ? ledger.status() : null;
      if (!ledgerStatus || ledgerStatus.stale === true) return engine._reject('LEDGER_UNAVAILABLE_OR_STALE', { type, character, indices });
      const reservation = this.runtime && this.runtime.merchantSelfGearReservation;
      const selfGear = !!(request.metadata && request.metadata.selfGear === true
        && reservation
        && reservation.sessionId === request.metadata.selfGearSessionId
        && reservation.type === type
        && reservation.character === character
        && Array.isArray(reservation.indices)
        && reservation.indices.length === indices.length
        && reservation.indices.every((value) => indices.includes(Number(value))));
      const inputs = [];
      for (const index of indices) {
        let entry = null;
        try { entry = ledger.get(character, index); } catch (_) {}
        if (!entry) return engine._reject('LEDGER_ITEM_NOT_FOUND', { type, character, index });
        const targetedGearCompound = type === 'COMPOUND' && this.targetedGearCompoundInputAllowed(entry, request.metadata || {}, index);
        if (!selfGear && !EXPECTED_DISPOSITIONS[type].has(String(entry.disposition || '')) && !targetedGearCompound) {
          return engine._reject('LEDGER_DISPOSITION_NOT_AUTHORIZED', { type, character, index, disposition: entry.disposition });
        }
        if (selfGear && (String(entry.name || '') !== String(reservation.item || '') || levelOf(entry) !== levelOf({ level: reservation.level }))) return engine._reject('SELF_GEAR_RESERVATION_IDENTITY_MISMATCH', { type, character, index });
        const key = String(entry.key || `${character}:${index}`);
        const existing = engine.reservations && engine.reservations.get(key);
        if (existing) return engine._reject('ITEM_ALREADY_RESERVED', { type, reservationKey: key, transactionId: existing });
        inputs.push({ key, character, index, item: String(entry.name), level: levelOf(entry), quantity: 1, disposition: entry.disposition });
      }
      if (type === 'COMPOUND') {
        const first = inputs[0];
        if (!inputs.every((row) => row.item === first.item && row.level === first.level)) return engine._reject('COMPOUND_INPUT_IDENTITY_MISMATCH', { inputs });
      }
      if (typeof engine._evictIfNeeded === 'function') engine._evictIfNeeded();
      if (engine.transactions && engine.transactions.size >= engine.capacity) return engine._reject('TRANSACTION_CAPACITY_EXHAUSTED', { capacity: engine.capacity });
      const now = this.now();
      const id = typeof engine._id === 'function' ? engine._id(type) : `tx-${now.toString(36)}-${type.toLowerCase()}`;
      const first = inputs[0];
      const row = {
        schemaVersion: 1,
        id,
        type,
        state: 'RESERVED',
        createdAt: now,
        updatedAt: now,
        leaseExpiresAt: now + Math.max(finite(engine.leaseMs, 30000), this.options.atomicLeaseMs),
        character,
        index: first.index,
        indices: inputs.map((input) => input.index),
        quantity: type === 'COMPOUND' ? 3 : 1,
        reservationKey: first.key,
        reservationKeys: inputs.map((input) => input.key),
        inputs,
        item: first.item,
        level: first.level,
        disposition: first.disposition,
        expectedDisposition: [...EXPECTED_DISPOSITIONS[type]],
        reason: 'ALPHA27_ATOMIC_PREFLIGHT_OK_RESERVED',
        executionAllowed: true,
        actionAuthority: 'alpha27-controlled-merchant',
        restartReconcileRequired: false,
        metadata: request.metadata && typeof request.metadata === 'object' ? clone(request.metadata) : {}
      };
      engine.transactions.set(id, row);
      for (const input of inputs) engine.reservations.set(input.key, id);
      engine.stats.planned += 1;
      this.stats.atomicTransactionsPlanned += 1;
      this.stats.atomicInputReservations += inputs.length;
      if (typeof engine._event === 'function') engine._event('TRANSACTION_ATOMIC_RESERVED', 'info', null, { transactionId: id, type, item: row.item, indices: row.indices, reservationKeys: row.reservationKeys });
      engine.save();
      return { accepted: true, transaction: clone(row) };
    };

    engine.reconcileAtomic = (id) => {
      const row = engine.transactions.get(String(id));
      if (!row) return { reconciled: false, reason: 'TRANSACTION_NOT_FOUND' };
      if (row.state !== 'RECOVERING') return { reconciled: false, reason: 'TRANSACTION_NOT_RECOVERING', transaction: clone(row) };
      let outcome = null;
      let after = null;
      if (row.preAction && row.mutationScroll) {
        const before = row.preAction;
        after = {
          baseLevelQuantity: identityQuantity(inventoryOf(this.root), row.item, row.level),
          nextLevelQuantity: identityQuantity(inventoryOf(this.root), row.item, levelOf(row) + 1),
          scrollQuantity: identityQuantity(inventoryOf(this.root), row.mutationScroll, 0)
        };
        const scrollReduced = after.scrollQuantity < finite(before.scrollQuantity, 0);
        const upgraded = after.nextLevelQuantity > finite(before.nextLevelQuantity, 0) && after.baseLevelQuantity < finite(before.baseLevelQuantity, 0);
        if (upgraded && scrollReduced) outcome = 'SUCCESS';
        else if (scrollReduced && row.type === 'UPGRADE' && after.nextLevelQuantity === finite(before.nextLevelQuantity, 0) && after.baseLevelQuantity <= finite(before.baseLevelQuantity, 0)) {
          outcome = after.baseLevelQuantity < finite(before.baseLevelQuantity, 0) ? 'FAILED_ROLL_ITEM_LOST' : 'FAILED_ROLL_ITEM_SURVIVED';
        } else if (scrollReduced && row.type === 'COMPOUND' && after.nextLevelQuantity === finite(before.nextLevelQuantity, 0) && after.baseLevelQuantity <= Math.max(0, finite(before.baseLevelQuantity, 0) - 3)) {
          outcome = 'FAILED_ROLL_INPUTS_CONSUMED';
        }
      }
      if (outcome) {
        engine.stats.reconciled += 1;
        engine.markCommitted(row.id, { before: clone(row.preAction), after, outcome, commitBasis: 'RESTART_STRICT_ITEM_AND_SCROLL_DELTA' });
        return { reconciled: true, committed: true, outcome, transaction: engine.get(row.id) };
      }
      row.state = 'ABORTED';
      row.reason = 'RESTART_ATOMIC_OUTCOME_UNCERTAIN_NO_RETRY';
      row.updatedAt = this.now();
      row.leaseExpiresAt = null;
      row.restartReconcileRequired = false;
      engine._release(row);
      engine.stats.reconciled += 1;
      this.stats.restartAtomicTransactionsAborted += 1;
      engine.save();
      return { reconciled: true, committed: false, transaction: clone(row) };
    };

    const baseStatus = engine.status.bind(engine);
    engine.status = () => {
      const status = baseStatus();
      const controlled = this.runtime.controlledMerchant && this.runtime.controlledMerchant.status ? this.runtime.controlledMerchant.status() : null;
      const liveFamilies = controlled && controlled.enabled ? ['SELL', 'BANK', ...(controlled.upgradeEnabled ? ['UPGRADE'] : []), ...(controlled.compoundEnabled ? ['COMPOUND'] : [])] : [];
      return { ...status, mode: 'alpha27-atomic-transaction-authority', atomicMultiItemReservations: true, restartBlindRetryForbidden: true, liveExecutionEnabled: liveFamilies.length > 0, liveFamilies };
    };

    for (const row of engine.transactions.values()) {
      if (row && row.state === 'RECOVERING' && Array.isArray(row.reservationKeys)) for (const key of row.reservationKeys) engine.reservations.set(String(key), row.id);
    }
    engine.__alpha27AtomicPatched = true;
    return true;
  }
}

module.exports = { Alpha27AtomicTransactionEngine };
