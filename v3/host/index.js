'use strict';

const { HostWatchdogSupervisor, HOST_RESTART_ACK, HOST_SUPERVISOR_SCHEMA_VERSION } = require('./host-watchdog-supervisor');
const { JsonFileStateStore } = require('./json-file-state-store');
const { AlertRelay, ALERT_RELAY_SCHEMA_VERSION } = require('./alert-relay');
const { HeadlessHostController } = require('./headless-host-controller');
const { ManagedProcessLauncher } = require('./managed-process-launcher');
const { HostApiServer, isLoopback, safeEqual } = require('./host-api-server');
const { createWebhookAlertTransport, validateWebhookUrl } = require('./alert-transports');
const { RestartReconciliationObserver } = require('./restart-reconciliation-observer');
const { BrowserBotClient, DEFAULT_ALLOWED_ORIGINS, MAX_CLAIM_IDS, MAX_ID_LENGTH } = require('./browser-bot-client');
const { CdpAdventureLandSessionDriver, CDP_SESSION_SCHEMA_VERSION, DEFAULT_CDP_ENDPOINT, DEFAULT_ADVENTURE_LAND_ORIGIN } = require('./cdp-adventure-land-session');
const { ProductionHostHarness } = require('./production-host-harness');
const { FtpsDiagnosticsUploader } = require('./ftps-diagnostics-uploader');
const { ProblemDiagnosticsArchive } = require('./problem-diagnostics-archive');

module.exports = {
  HostWatchdogSupervisor,
  HOST_RESTART_ACK,
  HOST_SUPERVISOR_SCHEMA_VERSION,
  JsonFileStateStore,
  AlertRelay,
  ALERT_RELAY_SCHEMA_VERSION,
  HeadlessHostController,
  ManagedProcessLauncher,
  HostApiServer,
  isLoopback,
  safeEqual,
  createWebhookAlertTransport,
  validateWebhookUrl,
  RestartReconciliationObserver,
  BrowserBotClient,
  DEFAULT_ALLOWED_ORIGINS,
  MAX_CLAIM_IDS,
  MAX_ID_LENGTH,
  CdpAdventureLandSessionDriver,
  CDP_SESSION_SCHEMA_VERSION,
  DEFAULT_CDP_ENDPOINT,
  DEFAULT_ADVENTURE_LAND_ORIGIN,
  ProductionHostHarness,
  FtpsDiagnosticsUploader,
  ProblemDiagnosticsArchive
};
