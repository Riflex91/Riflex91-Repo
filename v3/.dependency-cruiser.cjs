'use strict';

module.exports = {
  forbidden: [
    {
      name: 'no-circular-critical-runtime-dependencies',
      comment: 'Critical Farmer, reliability and Merchant runtime modules must remain acyclic.',
      severity: 'error',
      from: { path: '^src/(farmer|reliability|merchant)/' },
      to: { circular: true }
    },
    {
      name: 'runtime-must-not-import-tests',
      comment: 'Production runtime code may never depend on test code.',
      severity: 'error',
      from: { path: '^src/' },
      to: { path: '^test/' }
    },
    {
      name: 'merchant-must-not-import-farmer-runtime',
      comment: 'Merchant economy/control modules must not acquire Farmer combat authority through direct runtime imports.',
      severity: 'error',
      from: { path: '^src/merchant/' },
      to: { path: '^src/farmer/' }
    }
  ],
  options: {
    doNotFollow: { path: 'node_modules' }
  }
};
