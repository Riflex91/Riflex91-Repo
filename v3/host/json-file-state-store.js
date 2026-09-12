'use strict';

const fs = require('node:fs');
const path = require('node:path');

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

class JsonFileStateStore {
  constructor(options = {}) {
    if (!options.filePath) throw new Error('filePath required');
    this.filePath = path.resolve(String(options.filePath));
    this.maxBytes = Math.max(4096, Math.min(16 * 1024 * 1024, Number(options.maxBytes) || 1024 * 1024));
    this.mode = options.mode == null ? 0o600 : Number(options.mode);
    this.stats = { loads: 0, saves: 0, missing: 0, corrupt: 0, oversized: 0, failures: 0 };
    this.lastError = null;
  }

  _setError(code, error) {
    this.lastError = {
      code,
      message: String(error && error.message || error || code).slice(0, 256),
      at: Date.now()
    };
  }

  load(fallback = null) {
    this.stats.loads += 1;
    try {
      const stat = fs.statSync(this.filePath);
      if (stat.size > this.maxBytes) {
        this.stats.oversized += 1;
        this._setError('STATE_FILE_OVERSIZED', new Error(`state file is ${stat.size} bytes`));
        return clone(fallback);
      }
      const text = fs.readFileSync(this.filePath, 'utf8');
      if (Buffer.byteLength(text, 'utf8') > this.maxBytes) {
        this.stats.oversized += 1;
        this._setError('STATE_FILE_OVERSIZED', new Error('state file exceeds byte limit'));
        return clone(fallback);
      }
      const value = JSON.parse(text);
      this.lastError = null;
      return value;
    } catch (error) {
      if (error && error.code === 'ENOENT') {
        this.stats.missing += 1;
        this.lastError = null;
        return clone(fallback);
      }
      if (error instanceof SyntaxError) this.stats.corrupt += 1;
      else this.stats.failures += 1;
      this._setError(error instanceof SyntaxError ? 'STATE_FILE_CORRUPT' : 'STATE_LOAD_FAILED', error);
      return clone(fallback);
    }
  }

  save(value) {
    let text;
    try {
      text = JSON.stringify(value);
    } catch (error) {
      this.stats.failures += 1;
      this._setError('STATE_SERIALIZE_FAILED', error);
      return false;
    }
    const bytes = Buffer.byteLength(text, 'utf8');
    if (bytes > this.maxBytes) {
      this.stats.oversized += 1;
      this._setError('STATE_PAYLOAD_OVERSIZED', new Error(`payload is ${bytes} bytes`));
      return false;
    }

    const directory = path.dirname(this.filePath);
    const tempPath = `${this.filePath}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    let fd = null;
    try {
      fs.mkdirSync(directory, { recursive: true });
      fd = fs.openSync(tempPath, 'wx', this.mode);
      fs.writeFileSync(fd, text, { encoding: 'utf8' });
      fs.fsyncSync(fd);
      fs.closeSync(fd);
      fd = null;
      fs.renameSync(tempPath, this.filePath);
      try { fs.chmodSync(this.filePath, this.mode); } catch (_) {}
      try {
        const dirFd = fs.openSync(directory, 'r');
        try { fs.fsyncSync(dirFd); } finally { fs.closeSync(dirFd); }
      } catch (_) {}
      this.stats.saves += 1;
      this.lastError = null;
      return true;
    } catch (error) {
      this.stats.failures += 1;
      this._setError('STATE_SAVE_FAILED', error);
      if (fd != null) {
        try { fs.closeSync(fd); } catch (_) {}
      }
      try { fs.unlinkSync(tempPath); } catch (_) {}
      return false;
    }
  }

  status() {
    return {
      mode: 'atomic-json-file',
      filePath: this.filePath,
      maxBytes: this.maxBytes,
      fileMode: this.mode,
      lastError: clone(this.lastError),
      stats: { ...this.stats }
    };
  }
}

module.exports = { JsonFileStateStore };
