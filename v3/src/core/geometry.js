'use strict';

const { finite } = require('./numeric');

function distance(a, b) {
  if (!a || !b) return Infinity;
  const ax = finite(a.x, null);
  const ay = finite(a.y, null);
  const bx = finite(b.x, null);
  const by = finite(b.y, null);
  if (ax == null || ay == null || bx == null || by == null) return Infinity;
  return Math.hypot(ax - bx, ay - by);
}

module.exports = { distance };
