'use strict';

const childProcess = require('node:child_process');

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}
function bounded(value, max = 1024) {
  return String(value == null ? '' : value).slice(0, max);
}

class ManagedProcessLauncher {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.spawn = options.spawn || childProcess.spawn;
    this.command = bounded(options.command || '', 4096);
    this.args = Array.isArray(options.args) ? options.args.slice(0, 256).map((value) => bounded(value, 4096)) : [];
    this.cwd = options.cwd ? bounded(options.cwd, 4096) : undefined;
    this.env = options.env && typeof options.env === 'object' ? { ...process.env, ...options.env } : { ...process.env };
    this.stopGraceMs = Math.max(1000, Math.min(60000, finite(options.stopGraceMs, 10000)));
    this.outputCapacity = Math.max(10, Math.min(1000, Math.floor(finite(options.outputCapacity, 100))));
    this.child = null;
    this.generation = 0;
    this.startedAt = null;
    this.lastExit = null;
    this.lastError = null;
    this.restartInFlight = null;
    this.output = [];
    this.stats = { starts: 0, startFailures: 0, stops: 0, forcedKills: 0, restarts: 0, exits: 0 };
  }

  _recordOutput(stream, chunk) {
    const text = bounded(Buffer.isBuffer(chunk) ? chunk.toString('utf8') : chunk, 4096);
    this.output.push({ at: this.now(), stream, text });
    if (this.output.length > this.outputCapacity) this.output.splice(0, this.output.length - this.outputCapacity);
  }

  _attach(child, generation) {
    if (child.stdout && typeof child.stdout.on === 'function') child.stdout.on('data', (chunk) => this._recordOutput('stdout', chunk));
    if (child.stderr && typeof child.stderr.on === 'function') child.stderr.on('data', (chunk) => this._recordOutput('stderr', chunk));
    if (typeof child.on === 'function') {
      child.on('error', (error) => {
        if (generation !== this.generation) return;
        this.lastError = { at: this.now(), message: bounded(error && error.message || error, 256) };
      });
      child.on('exit', (code, signal) => {
        if (generation !== this.generation) return;
        this.stats.exits += 1;
        this.lastExit = { at: this.now(), code: code == null ? null : Number(code), signal: signal || null, generation };
        this.child = null;
      });
    }
  }

  async start(context = {}) {
    if (this.child) return { started: false, reason: 'PROCESS_ALREADY_RUNNING', status: this.status() };
    if (!this.command) return { started: false, reason: 'PROCESS_COMMAND_REQUIRED', status: this.status() };
    this.generation += 1;
    const generation = this.generation;
    try {
      const child = this.spawn(this.command, this.args.slice(), {
        cwd: this.cwd,
        env: this.env,
        shell: false,
        detached: false,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      if (!child || typeof child.kill !== 'function') throw new Error('spawn did not return a child process');
      this.child = child;
      this.startedAt = this.now();
      this.lastError = null;
      this.stats.starts += 1;
      this._attach(child, generation);
      return { started: true, generation, pid: finite(child.pid, null), context: clone(context) };
    } catch (error) {
      this.stats.startFailures += 1;
      this.lastError = { at: this.now(), message: bounded(error && error.message || error, 256) };
      this.child = null;
      return { started: false, reason: 'PROCESS_START_FAILED', error: clone(this.lastError) };
    }
  }

  _waitForExit(child, timeoutMs) {
    if (!child) return Promise.resolve(true);
    return new Promise((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(true);
      };
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        resolve(false);
      }, timeoutMs);
      if (typeof child.once === 'function') child.once('exit', done);
      if (child.exitCode != null || child.signalCode != null) done();
    });
  }

  async stop(reason = 'HOST_STOP') {
    const child = this.child;
    if (!child) return { stopped: true, duplicate: true, reason: 'PROCESS_NOT_RUNNING', forced: false };
    this.stats.stops += 1;
    let forced = false;
    try { child.kill('SIGTERM'); } catch (_) {}
    let exited = await this._waitForExit(child, this.stopGraceMs);
    if (!exited && this.child === child) {
      forced = true;
      this.stats.forcedKills += 1;
      try { child.kill('SIGKILL'); } catch (_) {}
      exited = await this._waitForExit(child, Math.min(5000, this.stopGraceMs));
    }
    if (this.child === child && (child.exitCode != null || child.signalCode != null || exited)) this.child = null;
    return { stopped: this.child !== child, forced, reason: bounded(reason, 128) };
  }

  async restart(context = {}) {
    if (this.restartInFlight) return this.restartInFlight;
    this.restartInFlight = (async () => {
      this.stats.restarts += 1;
      const stopped = await this.stop(context.reason || 'WATCHDOG_RESTART');
      if (!stopped.stopped) return { ok: false, reason: 'PROCESS_STOP_FAILED', stopped };
      const started = await this.start({ reason: context.reason || 'WATCHDOG_RESTART', previousRunId: context.runId || null });
      return { ok: started.started === true, stopped, started };
    })();
    try { return await this.restartInFlight; }
    finally { this.restartInFlight = null; }
  }

  tail(limit = 50) {
    const n = Math.max(0, Math.min(this.output.length, Math.floor(finite(limit, 0))));
    return this.output.slice(this.output.length - n).map(clone);
  }

  status() {
    return {
      mode: 'managed-external-process',
      running: !!this.child,
      pid: this.child ? finite(this.child.pid, null) : null,
      generation: this.generation,
      startedAt: this.startedAt,
      lastExit: clone(this.lastExit),
      lastError: clone(this.lastError),
      restartInFlight: !!this.restartInFlight,
      shell: false,
      gameplayActionAuthority: false,
      rawGameplayActionAuthority: false,
      stats: { ...this.stats }
    };
  }
}

module.exports = { ManagedProcessLauncher };
