'use strict';

const { clamp01, ratio } = require('../core/numeric');

function normalize(value, max) { return ratio(Math.max(0, Number(value) || 0), max, 0); }

class FarmPlanner {
  constructor(options = {}) {
    this.log = options.log || null;
    this.maxDeathsPerHour = Number.isFinite(Number(options.maxDeathsPerHour)) ? Number(options.maxDeathsPerHour) : 0.25;
    this.maxTravelSeconds = Number.isFinite(Number(options.maxTravelSeconds)) ? Number(options.maxTravelSeconds) : 600;
    this.explorationWeight = Number.isFinite(Number(options.explorationWeight)) ? Number(options.explorationWeight) : 0.04;
  }

  rank(candidates = [], context = {}) {
    const safe = candidates.filter((candidate) => {
      if (!candidate || !candidate.id) return false;
      if (candidate.blocked || candidate.unsafe) return false;
      const deaths = Math.max(0, Number(candidate.deathsPerHour) || 0);
      return deaths <= this.maxDeathsPerHour;
    });
    if (!safe.length) return [];

    const maxXp = Math.max(1, ...safe.map((c) => Math.max(0, Number(c.xpPerHour) || 0)));
    const maxGold = Math.max(1, ...safe.map((c) => Math.max(0, Number(c.goldPerHour) || 0)));
    const rows = safe.map((candidate) => {
      const xp = Math.max(0, Number(candidate.xpPerHour) || 0);
      const gold = Math.max(0, Number(candidate.goldPerHour) || 0);
      const deaths = Math.max(0, Number(candidate.deathsPerHour) || 0);
      const confidence = clamp01(candidate.confidence == null ? 0.2 : candidate.confidence);
      const travel = Math.max(0, Number(candidate.travelSeconds) || 0);
      const rate = normalize(xp, maxXp) * 0.68 + normalize(gold, maxGold) * 0.32;
      const reliability = 0.72 + confidence * 0.28;
      const risk = Math.max(0.15, 1 - (deaths / Math.max(this.maxDeathsPerHour, 0.01)) * 0.35);
      const travelPenalty = Math.min(0.12, (travel / Math.max(this.maxTravelSeconds, 1)) * 0.12);
      const exploration = (1 - confidence) * this.explorationWeight;
      const score = Math.max(0, rate * reliability * risk - travelPenalty + exploration);
      return {
        ...candidate,
        xpPerHour: xp,
        goldPerHour: gold,
        deathsPerHour: deaths,
        confidence,
        travelSeconds: travel,
        score,
        scoring: { rate, reliability, risk, travelPenalty, exploration }
      };
    });
    rows.sort((a, b) => b.score - a.score || b.xpPerHour - a.xpPerHour || b.goldPerHour - a.goldPerHour || a.travelSeconds - b.travelSeconds || String(a.id).localeCompare(String(b.id)));
    if (this.log && rows[0]) {
      this.log.emit({
        component: 'planner',
        event: 'FARM_TARGET_RANKED',
        character: context.character || null,
        data: {
          selected: rows[0].id,
          partyFingerprint: context.partyFingerprint || null,
          top: rows.slice(0, 5).map((r) => ({ id: r.id, score: Number(r.score.toFixed(5)), xpPerHour: Math.round(r.xpPerHour), goldPerHour: Math.round(r.goldPerHour), deathsPerHour: Number(r.deathsPerHour.toFixed(3)), confidence: Number(r.confidence.toFixed(3)), travelSeconds: Math.round(r.travelSeconds) }))
        }
      });
    }
    return rows;
  }
}

module.exports = { FarmPlanner };
