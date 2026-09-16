'use strict';

module.exports = {
  forbidden: [
    {
      name: 'no-circular-v4-dependencies',
      severity: 'error',
      from: { path: '^(apps|packages)/' },
      to: { circular: true }
    },
    {
      name: 'packages-must-not-import-apps',
      severity: 'error',
      from: { path: '^packages/' },
      to: { path: '^apps/' }
    },
    {
      name: 'core-must-stay-foundational',
      severity: 'error',
      from: { path: '^packages/core/' },
      to: { path: '^packages/(domain|decision|intelligence|reliability|observability|adapters|protocols)/' }
    },
    {
      name: 'domain-must-not-depend-on-orchestration-or-infrastructure',
      severity: 'error',
      from: { path: '^packages/domain/' },
      to: { path: '^(apps/|packages/(decision|intelligence|reliability|observability|adapters)/)' }
    },
    {
      name: 'decision-must-not-call-adapters-directly',
      severity: 'error',
      from: { path: '^packages/decision/' },
      to: { path: '^(apps/|packages/adapters/)' }
    },
    {
      name: 'intelligence-must-not-control-runtime-directly',
      severity: 'error',
      from: { path: '^packages/intelligence/' },
      to: { path: '^(apps/|packages/adapters/)' }
    },
    {
      name: 'reliability-must-not-own-decision-logic',
      severity: 'error',
      from: { path: '^packages/reliability/' },
      to: { path: '^packages/(decision|intelligence)/' }
    }
  ],
  options: {
    doNotFollow: { path: 'node_modules' }
  }
};
