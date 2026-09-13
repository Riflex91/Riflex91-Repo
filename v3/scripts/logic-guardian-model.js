'use strict';

const LogicOutcome = Object.freeze({
  ATTACK: 'ATTACK',
  SELECT_TARGET: 'SELECT_TARGET',
  NAVIGATE: 'NAVIGATE',
  SAFE_STOP: 'SAFE_STOP',
  WAIT: 'WAIT',
  DEADLOCK: 'DEADLOCK'
});

function classifyCrossModuleDecision(input = {}) {
  const workExpected = input.workExpected === true;
  const attackAllowed = input.attackAllowed === true;
  const safeTargetAvailable = input.safeTargetAvailable === true;
  const planAvailable = input.planAvailable === true;
  const navigationBlocked = input.navigationBlocked === true;
  const explicitSafetyStop = input.explicitSafetyStop === true;
  const alternateProgress = input.alternateProgress === true;

  if (attackAllowed && safeTargetAvailable) return LogicOutcome.ATTACK;
  if (safeTargetAvailable) return LogicOutcome.SELECT_TARGET;
  if (planAvailable && !navigationBlocked) return LogicOutcome.NAVIGATE;
  if (alternateProgress) return LogicOutcome.SELECT_TARGET;
  if (explicitSafetyStop) return LogicOutcome.SAFE_STOP;
  if (workExpected) return LogicOutcome.DEADLOCK;
  return LogicOutcome.WAIT;
}

function traceHasBoundedProgress(trace, maxStagnantSteps = 6) {
  if (!Array.isArray(trace) || trace.length === 0) return false;
  let stagnant = 0;
  let previous = null;
  for (const step of trace) {
    const signature = String(step && step.signature || '');
    const progressed = !!(step && (step.action || step.explicitSafetyStop || step.progressed));
    if (progressed) return true;
    stagnant = signature === previous ? stagnant + 1 : 1;
    previous = signature;
    if (stagnant > maxStagnantSteps) return false;
  }
  return trace.length <= maxStagnantSteps;
}

module.exports = { LogicOutcome, classifyCrossModuleDecision, traceHasBoundedProgress };
