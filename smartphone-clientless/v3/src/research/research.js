'use strict';

const ExperimentState = Object.freeze({
  READY: 'READY',
  BLOCKED: 'BLOCKED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
});

const OBSERVATION_ONLY_KINDS = new Set(['OBSERVE', 'MEASURE', 'COMPARE']);

class ResearchJournal {
  constructor(options = {}) {
    this.world = options.world || null;
    this.log = options.log || null;
    this.now = options.now || (() => Date.now());
    this.hypotheses = new Map();
    this.experiments = new Map();
    this.nextHypothesisId = 1;
    this.nextExperimentId = 1;
  }

  hypothesis(spec = {}) {
    if (!spec.type || !spec.entityId || !spec.fact) throw new Error('type, entityId and fact are required');
    const id = spec.id || `hyp-${this.nextHypothesisId++}`;
    const record = {
      id,
      type: spec.type,
      entityId: String(spec.entityId),
      fact: spec.fact,
      value: spec.value,
      confidence: Math.max(0, Math.min(1, Number(spec.confidence == null ? 0.25 : spec.confidence))),
      rationale: spec.rationale || null,
      createdAt: this.now()
    };
    this.hypotheses.set(id, record);
    if (this.world) this.world.hypothesis(record.type, record.entityId, record.fact, record.value, record.confidence);
    if (this.log) this.log.emit({ component: 'research', event: 'HYPOTHESIS_RECORDED', data: record });
    return { ...record };
  }

  proposeExperiment(spec = {}) {
    const id = spec.id || `exp-${this.nextExperimentId++}`;
    const kind = String(spec.kind || 'OBSERVE').toUpperCase();
    const actions = Array.isArray(spec.actions) ? spec.actions.slice() : [];
    const observationOnly = OBSERVATION_ONLY_KINDS.has(kind) && !spec.requiresAction && actions.length === 0;
    const state = observationOnly ? ExperimentState.READY : ExperimentState.BLOCKED;
    const reason = observationOnly ? null : 'ALPHA_OBSERVATION_ONLY';
    const record = {
      id,
      kind,
      target: spec.target || null,
      hypothesisId: spec.hypothesisId || null,
      method: spec.method || null,
      state,
      reason,
      observationOnly,
      createdAt: this.now(),
      observations: []
    };
    this.experiments.set(id, record);
    if (this.log) this.log.emit({
      component: 'research',
      event: 'EXPERIMENT_PROPOSED',
      severity: state === ExperimentState.BLOCKED ? 'warn' : 'info',
      reason,
      data: { id, kind, target: record.target, hypothesisId: record.hypothesisId, observationOnly }
    });
    return this._cloneExperiment(record);
  }

  recordObservation(experimentId, observation = {}) {
    const record = this.experiments.get(experimentId);
    if (!record) throw new Error('unknown experiment');
    if (record.state === ExperimentState.BLOCKED || record.state === ExperimentState.CANCELLED) return this._cloneExperiment(record);
    record.observations.push({ at: this.now(), ...observation });
    if (observation.complete === true) record.state = ExperimentState.COMPLETED;
    if (this.log) this.log.emit({
      component: 'research',
      event: 'EXPERIMENT_OBSERVATION_RECORDED',
      data: { id: record.id, state: record.state, observation }
    });
    return this._cloneExperiment(record);
  }

  _cloneExperiment(record) {
    return { ...record, observations: record.observations.map((row) => ({ ...row })) };
  }

  listExperiments() {
    return [...this.experiments.values()].map((record) => this._cloneExperiment(record));
  }

  summary() {
    const states = {};
    for (const record of this.experiments.values()) states[record.state] = (states[record.state] || 0) + 1;
    return { hypotheses: this.hypotheses.size, experiments: this.experiments.size, states };
  }
}

module.exports = { ResearchJournal, ExperimentState, OBSERVATION_ONLY_KINDS };
