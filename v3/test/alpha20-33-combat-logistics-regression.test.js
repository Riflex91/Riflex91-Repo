'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  installActiveAggroKiteCohesionBypass,
  installSupportAggroMovementGate,
  installMerchantIncomingAggroAuthority,
  installFarmerGoldWindow
} = require('../src/reliability/alpha20-33-combat-logistics-regression-hotfix');

function stats() {
  return {
    kitingCohesionBypasses: 0,
    nonAggroOutwardMovesBlocked: 0,
    merchantTargetOnlyCombatHoldsPrevented: 0,
    goldLootObservations: 0,
    goldWindowOffers: 0,
    goldWindowTransfers: 0,
    goldWindowHolds: 0,
    goldWindowInsufficientSurplus: 0
  };
}

test('active self-aggro restores a kite blocked only by soft team cohesion', () => {
  const s = stats();
  const runtime = {
    farmer: { kiting: { evaluate: () => ({ shouldMove:false, reason:'TEAM_COHESION_KITE_LIMIT', x:20, y:30, teamCohesionBlocked:true }) } },
    lastSnapshot: { character:{ name:'My_Ranger1' }, entities:[] }
  };
  installActiveAggroKiteCohesionBypass(runtime, s);
  const ownAggro = runtime.farmer.kiting.evaluate({ name:'My_Ranger1' }, { id:'m1', mtype:'tortoise', hp:100, target:'My_Ranger1' });
  assert.equal(ownAggro.shouldMove, true);
  assert.equal(ownAggro.reason, 'ACTIVE_AGGRO_KITE_COHESION_BYPASS');
  assert.equal(ownAggro.x, 20);
  assert.equal(s.kitingCohesionBypasses, 1);
  const otherAggro = runtime.farmer.kiting.evaluate({ name:'My_Ranger1' }, { id:'m2', mtype:'tortoise', hp:100, target:'My_Ranger2' });
  assert.equal(otherAggro.shouldMove, false);
});

test('supporter outward move is blocked without self aggro but combat falls through', () => {
  const s = stats();
  let rawMoves = 0;
  let fellThrough = 0;
  const adapter = { command(action,args) { rawMoves += 1; return {executed:true, action,args}; } };
  const runtime = {
    lastSnapshot:null,
    farmer: {
      _engage(context) {
        const moved = context.adapter.command('move', [-10, 0]);
        if (!moved.executed) fellThrough += 1;
      }
    }
  };
  installSupportAggroMovementGate(runtime, s);
  const snapshot = { character:{ name:'My_Ranger2', x:0, y:0 }, entities:[] };
  runtime.farmer._engage({ snapshot, adapter }, { id:'m1', mtype:'tortoise', hp:100, x:10, y:0, target:'My_Ranger1' });
  assert.equal(rawMoves, 0);
  assert.equal(fellThrough, 1);
  assert.equal(s.nonAggroOutwardMovesBlocked, 1);
  runtime.farmer._engage({ snapshot, adapter }, { id:'m2', mtype:'tortoise', hp:100, x:10, y:0, target:'My_Ranger2' });
  assert.equal(rawMoves, 1);
});

test('merchant target alone no longer means combat; incoming monster aggro still does', () => {
  const s = stats();
  const parent = { entities:{} };
  const runtime = {
    root:{ parent, character:{ name:'My_Merchant', ctype:'merchant', target:'stale-target' } },
    _merchantInCombat(){ return true; }
  };
  const alpha27 = { atomic:{ merchantInCombat(){ return true; } } };
  installMerchantIncomingAggroAuthority(runtime, alpha27, s);
  assert.equal(runtime._merchantInCombat(), false);
  assert.equal(alpha27.atomic.merchantInCombat(), false);
  assert.ok(s.merchantTargetOnlyCombatHoldsPrevented >= 2);
  parent.entities.e1 = { id:'e1', mtype:'tortoise', hp:100, target:'My_Merchant' };
  assert.equal(runtime._merchantInCombat(), true);
  assert.equal(alpha27.atomic.merchantInCombat(), true);
});

test('farmer gold waits 30 seconds, batches recent loot, and enforces a 30 second transfer cadence', () => {
  const s = stats();
  let now = 0;
  const reserve = 250000;
  const logistics = {
    config:{ farmerGoldReserve:reserve, maxGoldBatch:1000000 },
    stats:{ goldVerified:0 },
    pendingOffer:null,
    pendingGrant:null,
    pendingOutbound:null,
    _offerOutbound(snapshot) {
      if (this.pendingOffer) return false;
      const surplus = Math.max(0, snapshot.character.gold - this.config.farmerGoldReserve);
      if (surplus > 0) {
        this.pendingOffer = { kind:'gold', offerId:`g-${now}`, amount:Math.min(surplus,this.config.maxGoldBatch) };
        return true;
      }
      this.itemPathVisited = (this.itemPathVisited || 0) + 1;
      return false;
    },
    _executeGrant() { return false; },
    _verifyPendingOutbound() {
      if (this.pendingOutbound && this.pendingOutbound.commit) {
        this.stats.goldVerified += 1;
        this.pendingOutbound = null;
        this.pendingOffer = null;
        this.pendingGrant = null;
      }
      return false;
    },
    tick(snapshot) { this._verifyPendingOutbound(snapshot); this._offerOutbound(snapshot); },
    status(){ return { config:{...this.config}, stats:{...this.stats} }; }
  };
  const runtime = {
    now:()=>now,
    controlledPartyLogistics:logistics,
    controlledFarmerLoot:{ lastObservation:null }
  };
  installFarmerGoldWindow(runtime,s,{ goldWindowMs:30000 });
  const snapshot = { character:{ name:'My_Ranger1', ctype:'ranger', gold:reserve+5000 } };

  runtime.controlledFarmerLoot.lastObservation = { at:0, requestId:'loot-1', delta:{gold:1200} };
  logistics.tick(snapshot);
  assert.equal(logistics.pendingOffer, null);
  assert.ok(logistics.itemPathVisited >= 1);

  now = 29999;
  logistics.tick(snapshot);
  assert.equal(logistics.pendingOffer, null);

  now = 30000;
  runtime.controlledFarmerLoot.lastObservation = { at:30000, requestId:'loot-2', delta:{gold:800} };
  logistics.tick(snapshot);
  assert.equal(logistics.pendingOffer.kind, 'gold');
  assert.equal(logistics.pendingOffer.amount, 2000);
  assert.equal(logistics.pendingOffer.windowLootAmount, 2000);

  logistics.pendingOutbound = { kind:'gold', commit:true };
  now = 30100;
  logistics._verifyPendingOutbound(snapshot);
  assert.equal(s.goldWindowTransfers, 1);
  assert.equal(logistics.pendingOffer, null);

  runtime.controlledFarmerLoot.lastObservation = { at:31000, requestId:'loot-3', delta:{gold:400} };
  now = 31000;
  logistics.tick(snapshot);
  assert.equal(logistics.pendingOffer, null);

  now = 60099;
  logistics.tick(snapshot);
  assert.equal(logistics.pendingOffer, null);

  now = 61000;
  logistics.tick(snapshot);
  assert.equal(logistics.pendingOffer.kind, 'gold');
  assert.equal(logistics.pendingOffer.amount, 400);
});
