'use strict';

const { ControlledPartyLogistics } = require('./controlled-party-logistics');

const FAIRNESS_PATCH = Symbol.for('AIO_V3_ALPHA20_15_LOGISTICS_FAIRNESS_PATCH');

function patchAlpha2015LogisticsFairness() {
  const proto = ControlledPartyLogistics && ControlledPartyLogistics.prototype;
  if (!proto || proto[FAIRNESS_PATCH]) return false;
  Object.defineProperty(proto, FAIRNESS_PATCH, { value: true, enumerable: false, configurable: false });

  proto._farmerTick = function alpha2015FairFarmerTick(snapshot) {
    this._prune();
    this._verifyPendingOutbound(snapshot);
    if (typeof this._maybeUseElixir === 'function') this._maybeUseElixir(snapshot);
    this._requestSupply(snapshot);

    if (this.pendingGrant && this.pendingOffer && snapshot && snapshot.character && snapshot.character.rip !== true) {
      this._executeGrant(snapshot);
    }
    if (this.pendingOffer || this.pendingGrant || this.pendingOutbound) return this.lastDecision;

    // Inventory drain keeps first priority even during normal farming combat.
    // Offers are serialized and the exact inventory identity is revalidated
    // again when the Merchant grant is executed.
    if (snapshot && snapshot.character && snapshot.character.rip !== true && this._offerInventoryItem(snapshot)) return this.lastDecision;

    // Gold has no inventory-slot cost and remains allowed whenever Merchant is
    // nearby, including during combat or after Merchant has stopped item intake.
    if (this._offerGoldAnytime(snapshot)) return this.lastDecision;

    return this.lastDecision;
  };

  return true;
}

module.exports = {
  patchAlpha2015LogisticsFairness
};
