const ALLOWED_ORIGIN = "https://adventure.land";

export function validiereLoopbackCdp(value) {
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "http:" || !["127.0.0.1", "localhost", "::1", "[::1]"].includes(host)) {
    throw new Error("R12_CDP_NUR_LOOPBACK_HTTP");
  }
  if (url.username || url.password) throw new Error("R12_CDP_CREDENTIALS_VERBOTEN");
  return new URL(url.href.endsWith("/") ? url.href : url.href + "/");
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class CdpSession {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.nextId = 0;
    this.pending = new Map();
    this.contexts = new Map();
  }

  async open() {
    if (typeof WebSocket !== "function") throw new Error("R12_NODE_WEBSOCKET_FEHLT");
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("R12_CDP_CONNECT_TIMEOUT")), 5000);
      this.ws.addEventListener("open", () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
      this.ws.addEventListener("error", () => {
        clearTimeout(timer);
        reject(new Error("R12_CDP_CONNECT_FEHLER"));
      }, { once: true });
    });
    this.ws.addEventListener("message", event => this.#message(event.data));
    this.ws.addEventListener("close", () => {
      for (const row of this.pending.values()) row.reject(new Error("R12_CDP_GETRENNT"));
      this.pending.clear();
    });
  }

  #message(raw) {
    let msg;
    try { msg = JSON.parse(String(raw)); } catch { return; }
    if (msg.method === "Runtime.executionContextCreated") {
      const context = msg.params?.context;
      if (context && Number.isInteger(context.id)) this.contexts.set(context.id, context);
    }
    if (msg.method === "Runtime.executionContextDestroyed") {
      const id = msg.params?.executionContextId;
      if (Number.isInteger(id)) this.contexts.delete(id);
    }
    if (Number.isInteger(msg.id) && this.pending.has(msg.id)) {
      const row = this.pending.get(msg.id);
      this.pending.delete(msg.id);
      if (msg.error) row.reject(new Error("R12_CDP_COMMAND_FEHLER:" + JSON.stringify(msg.error).slice(0, 300)));
      else row.resolve(msg.result);
    }
  }

  async command(method, params = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) throw new Error("R12_CDP_NICHT_OFFEN");
    const id = ++this.nextId;
    const promise = new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
    this.ws.send(JSON.stringify({ id, method, params }));
    return promise;
  }

  async enableRuntime() {
    await this.command("Runtime.enable");
    await sleep(150);
  }

  async evaluate(expression, contextId, optionen = {}) {
    const result = await this.command("Runtime.evaluate", {
      expression,
      contextId,
      returnByValue: true,
      awaitPromise: true,
      userGesture: optionen.userGesture === true,
    });
    if (result.exceptionDetails) {
      const detail = result.exceptionDetails.exception?.description
        || result.exceptionDetails.text
        || "R12_CDP_EVALUATE_EXCEPTION";
      throw new Error(String(detail).slice(0, 500));
    }
    return result.result?.value;
  }

  close() {
    try { this.ws?.close(); } catch {}
  }
}

export async function findeAdventureLandKontext(cdpBase) {
  const listUrl = new URL("json/list", cdpBase);
  const response = await fetch(listUrl, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error("R12_CDP_TARGET_LIST_HTTP_" + response.status);
  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length > 64) throw new Error("R12_CDP_TARGET_LIST_UNGUELTIG");

  const targets = rows.filter(row => {
    try {
      return row?.type === "page"
        && new URL(row.url).origin === ALLOWED_ORIGIN
        && typeof row.webSocketDebuggerUrl === "string";
    } catch {
      return false;
    }
  }).slice(0, 8);
  if (targets.length === 0) throw new Error("R12_ADVENTURE_LAND_TARGET_FEHLT");

  for (const target of targets) {
    const session = new CdpSession(target.webSocketDebuggerUrl);
    try {
      await session.open();
      await session.enableRuntime();
      const contexts = [...session.contexts.values()]
        .filter(context => context.origin === ALLOWED_ORIGIN)
        .slice(0, 32);
      for (const context of contexts) {
        const ok = await session.evaluate(`(() => {
          const root = typeof globalThis.equip === "function"
            ? globalThis
            : (globalThis.parent && typeof globalThis.parent.equip === "function" ? globalThis.parent : null);
          const c = root && root.character;
          const g = root && root.G;
          return !!(root && c && Array.isArray(c.items) && c.slots && g && g.items);
        })()`, context.id).catch(() => false);
        if (ok === true) return { session, contextId: context.id, targetUrl: target.url };
      }
    } catch {
      session.close();
      continue;
    }
    session.close();
  }
  throw new Error("R12_ADVENTURE_LAND_CODEKONTEXT_FEHLT");
}
