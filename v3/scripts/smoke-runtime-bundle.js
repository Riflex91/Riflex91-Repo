'use strict';

const fs = require('fs');
const path = require('path');

const bootstrapPath = path.resolve(__dirname, '../dist/aio-v3.js');
const runtimePath = path.resolve(__dirname, '../dist/aio-v3-runtime.js');
const originalReadFileSync = fs.readFileSync;

fs.readFileSync = function readRuntimeForExistingSmoke(file, ...args) {
  const candidate = typeof file === 'string' ? path.resolve(file) : null;
  if (candidate === bootstrapPath) return originalReadFileSync.call(fs, runtimePath, ...args);
  return originalReadFileSync.call(fs, file, ...args);
};

try {
  require('./smoke-bundle');
} finally {
  fs.readFileSync = originalReadFileSync;
}
