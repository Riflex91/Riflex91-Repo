'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { Readable } = require('node:stream');

const DEFAULT_PORT = 21;
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_MAX_FILES_PER_FLUSH = 4;
const DEFAULT_BASE_BACKOFF_MS = 30 * 1000;
const DEFAULT_MAX_BACKOFF_MS = 30 * 60 * 1000;

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function bool(value, fallback = false) {
  if (value == null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return /^(1|true|yes|on)$/i.test(String(value).trim());
}
function safeSegment(value, fallback = 'adventure-land-v3') {
  const text = String(value || fallback).trim().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  return (text || fallback).slice(0, 128);
}
function normalizeRemoteRoot(value) {
  const raw = String(value || '/diagnostics/v3').trim().replace(/\\/g, '/');
  const parts = raw.split('/').filter(Boolean).filter((part) => part !== '.' && part !== '..');
  return `/${parts.join('/')}`;
}
function defaultClientFactory(timeoutMs) {
  return () => {
    const { Client } = require('basic-ftp');
    return new Client(timeoutMs);
  };
}

class FtpsDiagnosticsUploader {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.host = options.host ? String(options.host).trim() : null;
    this.port = Math.max(1, Math.min(65535, Math.floor(finite(options.port, DEFAULT_PORT))));
    this.user = options.user ? String(options.user) : null;
    this.password = options.password ? String(options.password) : null;
    this.secure = options.secure == null ? true : bool(options.secure, true);
    this.allowInsecureForTests = options.allowInsecureForTests === true;
    if (!this.secure && !this.allowInsecureForTests && (this.host || this.user || this.password)) throw new Error('DIAGNOSTICS_FTPS_TLS_REQUIRED');
    this.rejectUnauthorized = options.rejectUnauthorized == null ? true : bool(options.rejectUnauthorized, true);
    this.root = normalizeRemoteRoot(options.root);
    this.botId = safeSegment(options.botId);
    this.timeoutMs = Math.max(1000, Math.min(60000, Math.floor(finite(options.timeoutMs, DEFAULT_TIMEOUT_MS))));
    this.maxFilesPerFlush = Math.max(1, Math.min(50, Math.floor(finite(options.maxFilesPerFlush, DEFAULT_MAX_FILES_PER_FLUSH))));
    this.baseBackoffMs = Math.max(5000, Math.min(10 * 60 * 1000, Math.floor(finite(options.baseBackoffMs, DEFAULT_BASE_BACKOFF_MS))));
    this.maxBackoffMs = Math.max(this.baseBackoffMs, Math.min(60 * 60 * 1000, Math.floor(finite(options.maxBackoffMs, DEFAULT_MAX_BACKOFF_MS))));
    this.clientFactory = options.clientFactory || defaultClientFactory(this.timeoutMs);
    this.lastAttemptAt = null;
    this.lastSuccessAt = null;
    this.lastError = null;
    this.lastUpload = null;
    this.nextAttemptAt = 0;
    this.failuresInRow = 0;
    this.stats = { flushes: 0, uploaded: 0, failures: 0, bytesUploaded: 0, skippedDisabled: 0, skippedBackoff: 0 };
  }

  enabled() {
    return !!(this.host && this.user && this.password && typeof this.clientFactory === 'function');
  }

  _accessOptions() {
    return {
      host: this.host,
      port: this.port,
      user: this.user,
      password: this.password,
      secure: this.secure,
      secureOptions: this.secure ? { rejectUnauthorized: this.rejectUnauthorized } : undefined
    };
  }

  _backoffMs() {
    return Math.min(this.maxBackoffMs, this.baseBackoffMs * Math.pow(2, Math.min(10, Math.max(0, this.failuresInRow - 1))));
  }

  _safeError(error) {
    let message = String(error && error.message || error || 'DIAGNOSTICS_FTPS_FAILED');
    if (this.password) message = message.split(this.password).join('[REDACTED]');
    return message.slice(0, 256);
  }

  async _pendingFiles(spoolDir) {
    const pendingDir = path.join(spoolDir, 'pending');
    let names;
    try { names = await fs.readdir(pendingDir); }
    catch (error) {
      if (error && error.code === 'ENOENT') return [];
      throw error;
    }
    return names.filter((name) => /^problem-.*\.json\.gz$/.test(name)).sort().slice(0, this.maxFilesPerFlush)
      .map((name) => path.join(pendingDir, name));
  }

  async _uploadOne(client, localPath) {
    const stat = await fs.stat(localPath);
    const name = path.basename(localPath);
    const metadataPath = `${localPath}.meta.json`;
    let metadata = {};
    try { metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8')); } catch (_) {}

    const day = safeSegment(metadata.day || new Date(this.now()).toISOString().slice(0, 10));
    const remoteDir = `${this.root}/${this.botId}/${day}`;
    const remoteFinal = `${remoteDir}/${name}`;
    const remotePart = `${remoteFinal}.part`;
    await client.ensureDir(remoteDir);
    await client.uploadFrom(localPath, remotePart);
    const remoteSize = await client.size(remotePart);
    if (Number(remoteSize) !== Number(stat.size)) throw new Error(`DIAGNOSTICS_FTPS_SIZE_MISMATCH:${stat.size}:${remoteSize}`);
    try { await client.remove(remoteFinal, true); } catch (_) {}
    await client.rename(remotePart, remoteFinal);

    const sha256 = String(metadata.sha256 || '');
    if (sha256) await client.uploadFrom(Readable.from(`${sha256}  ${name}\n`), `${remoteFinal}.sha256`);
    const index = {
      schemaVersion: 1,
      type: 'AIO_V3_LATEST_PROBLEM_INDEX',
      botId: this.botId,
      capturedAt: metadata.capturedAt || null,
      bundleId: metadata.bundleId || null,
      severity: metadata.severity || null,
      reason: metadata.reason || null,
      sha256: sha256 || null,
      bytes: stat.size,
      remotePath: remoteFinal
    };
    const latestPart = `${this.root}/${this.botId}/latest-problem.json.part`;
    const latestFinal = `${this.root}/${this.botId}/latest-problem.json`;
    await client.uploadFrom(Readable.from(`${JSON.stringify(index, null, 2)}\n`), latestPart);
    try { await client.remove(latestFinal, true); } catch (_) {}
    await client.rename(latestPart, latestFinal);

    await fs.rm(localPath, { force: true });
    await fs.rm(metadataPath, { force: true });
    this.stats.uploaded += 1;
    this.stats.bytesUploaded += stat.size;
    this.lastUpload = { at: this.now(), name, bytes: stat.size, sha256: sha256 || null, remotePath: remoteFinal };
    return this.lastUpload;
  }

  async flush(spoolDir) {
    this.stats.flushes += 1;
    if (!this.enabled()) {
      this.stats.skippedDisabled += 1;
      return { uploaded: 0, reason: 'DIAGNOSTICS_FTPS_DISABLED' };
    }
    const files = await this._pendingFiles(spoolDir);
    if (!files.length) return { uploaded: 0, reason: 'DIAGNOSTICS_FTPS_NOTHING_PENDING' };

    const now = this.now();
    if (now < this.nextAttemptAt) {
      this.stats.skippedBackoff += 1;
      return { uploaded: 0, reason: 'DIAGNOSTICS_FTPS_BACKOFF', nextAttemptAt: this.nextAttemptAt };
    }

    this.lastAttemptAt = now;
    const client = this.clientFactory();
    let uploaded = 0;
    try {
      await client.access(this._accessOptions());
      for (const localPath of files) {
        await this._uploadOne(client, localPath);
        uploaded += 1;
      }
      this.lastSuccessAt = this.now();
      this.lastError = null;
      this.failuresInRow = 0;
      this.nextAttemptAt = 0;
      return { uploaded, reason: 'DIAGNOSTICS_FTPS_FLUSHED' };
    } catch (error) {
      this.stats.failures += 1;
      this.failuresInRow += 1;
      this.nextAttemptAt = now + this._backoffMs();
      this.lastError = { at: now, message: this._safeError(error) };
      return { uploaded, reason: 'DIAGNOSTICS_FTPS_FAILED', error: { ...this.lastError }, nextAttemptAt: this.nextAttemptAt };
    } finally {
      try { client.close(); } catch (_) {}
    }
  }

  status() {
    return {
      mode: 'host-ftps-diagnostics-uploader',
      enabled: this.enabled(),
      hostConfigured: !!this.host,
      userConfigured: !!this.user,
      passwordConfigured: !!this.password,
      secure: this.secure,
      rejectUnauthorized: this.rejectUnauthorized,
      root: this.root,
      botId: this.botId,
      timeoutMs: this.timeoutMs,
      maxFilesPerFlush: this.maxFilesPerFlush,
      baseBackoffMs: this.baseBackoffMs,
      maxBackoffMs: this.maxBackoffMs,
      nextAttemptAt: this.nextAttemptAt,
      failuresInRow: this.failuresInRow,
      lastAttemptAt: this.lastAttemptAt,
      lastSuccessAt: this.lastSuccessAt,
      lastError: this.lastError && { ...this.lastError },
      lastUpload: this.lastUpload && { ...this.lastUpload },
      credentialsExposed: false,
      gameplayActionAuthority: false,
      rawGameplayActionAuthority: false,
      stats: { ...this.stats }
    };
  }
}

module.exports = {
  FtpsDiagnosticsUploader,
  DEFAULT_PORT,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_MAX_FILES_PER_FLUSH,
  DEFAULT_BASE_BACKOFF_MS,
  DEFAULT_MAX_BACKOFF_MS,
  normalizeRemoteRoot
};
