'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { WorldModel, EvidenceKind } = require('../src/world/world-model');
const { DiscoveryService } = require('../src/world/discovery');
const { ResearchJournal, ExperimentState } = require('../src/research/research');

test('Discovery separates observed live knowledge from inferred current-map metadata', () => {
  const world = new WorldModel({ now: () => 1000 });
  const discovery = new DiscoveryService({ world, now: () => 1000 });
  discovery.scan({
    character: { name: 'R1', map: 'main' },
    entities: [
      { id: 'm1', mtype: 'goo', map: 'main', x: 1, y: 2, hp: 100, dead: false },
      { id: 'n1', name: 'LiveNPC', type: 'npc', npc: true, map: 'main', x: 3, y: 4 }
    ],
    objects: [{ id: 'c1', name: 'chest', type: 'chest', map: 'main', x: 5, y: 6 }]
  }, {
    maps: { main: { npcs: ['StaticNPC'], monsters: ['bee'], doors: [[10, 20]] } }
  });

  assert.equal(world.fact('monster', 'goo', 'lastSeenSource').evidence, EvidenceKind.OBSERVED);
  assert.equal(world.fact('npc', 'StaticNPC', 'lastSeenSource').evidence, EvidenceKind.INFERRED);
  assert.equal(world.hasEntity('object', 'chest'), true);
  assert.equal(world.hasEntity('object', 'door:main:0'), true);
});

test('ResearchJournal records hypotheses but blocks action-requiring experiments in alpha.2', () => {
  const world = new WorldModel({ now: () => 1000 });
  const research = new ResearchJournal({ world, now: () => 1000 });
  const hypothesis = research.hypothesis({ type: 'monster', entityId: 'goo', fact: 'good_farm', value: true });
  assert.equal(world.fact('monster', 'goo', 'good_farm').evidence, EvidenceKind.HYPOTHESIS);

  const safe = research.proposeExperiment({ kind: 'MEASURE', target: 'goo', hypothesisId: hypothesis.id });
  assert.equal(safe.state, ExperimentState.READY);
  const blocked = research.proposeExperiment({ kind: 'MEASURE', target: 'goo', requiresAction: true, actions: ['sell'] });
  assert.equal(blocked.state, ExperimentState.BLOCKED);
  assert.equal(blocked.reason, 'ALPHA_OBSERVATION_ONLY');
});
