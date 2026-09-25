import type { WorldPoint } from "../render/projection";
import type { LegacyGlobalsLike } from "./LegacyMirrorBridge";

export const PINNED_ADVENTURE_LAND_COMMIT =
  "ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4";

export type GraphicsMode = "2.5d" | "original";

export type LegacyMapClickEvent = Readonly<{
  data: Readonly<{
    global: Readonly<{
      x: number;
      y: number;
    }>;
  }>;
  stopPropagation: () => void;
}>;

export type LegacyCompatibilitySource = LegacyGlobalsLike & {
  map_click?: (event: LegacyMapClickEvent) => unknown;
  monster_click?: (event: LegacyMapClickEvent) => unknown;
  player_click?: (event: LegacyMapClickEvent) => unknown;
  npc_right_click?: (event: LegacyMapClickEvent) => unknown;
  enter_selected_character?: (name: string, id: string) => unknown;
  socket?: Readonly<{ connected?: boolean }>;
  socket_welcomed?: boolean;
  X?: Readonly<{
    characters?: readonly Readonly<{
      id?: string;
      name?: string;
    }>[];
  }>;
  width?: number;
  height?: number;
  scale?: number;
  manual_centering?: boolean;
  document?: Document;
  __AL25D_UPSTREAM_COMMIT__?: string;
};

type HiddenCanvasState = Readonly<{
  element: HTMLElement;
  visibility: string;
  pointerEvents: string;
}>;

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

function requiredCharacter(source: LegacyCompatibilitySource) {
  const character = source.character;

  if (!character) {
    throw new Error("Legacy character is not available yet");
  }

  return character;
}

/**
 * Builds the exact PIXI-style pointer shape consumed by the pinned
 * Adventure Land map_click(event) path.
 *
 * map_click converts event.data.global back to world coordinates itself and
 * invokes call_code_function("on_map_click", x, y) before default movement.
 * Feeding that original path preserves CODE cancellation and socket semantics.
 */
export function createLegacyMapClickEvent(
  target: WorldPoint,
  source: LegacyCompatibilitySource
): LegacyMapClickEvent {
  const character = requiredCharacter(source);
  const scale = Math.max(0.000001, finiteNumber(source.scale, 1));
  const realX = finiteNumber(character.real_x, finiteNumber(character.x, 0));
  const realY = finiteNumber(character.real_y, finiteNumber(character.y, 0));
  const width = finiteNumber(source.width, 0);
  const height = finiteNumber(source.height, 0);

  const screenOriginX =
    source.manual_centering
      ? finiteNumber(character.x, width / 2)
      : width / 2;
  const screenOriginY =
    source.manual_centering
      ? finiteNumber(character.y, height / 2)
      : height / 2;

  return Object.freeze({
    data: Object.freeze({
      global: Object.freeze({
        x: screenOriginX + (target.x - realX) * scale,
        y: screenOriginY + (target.y - realY) * scale
      })
    }),
    stopPropagation: () => {}
  });
}

export function dispatchLegacyWorldClick(
  target: WorldPoint,
  source: LegacyCompatibilitySource
): unknown {
  if (typeof source.map_click !== "function") {
    throw new Error("Legacy map_click is not available");
  }

  return source.map_click.call(source, createLegacyMapClickEvent(target, source));
}

export function dispatchLegacyEntityClick(
  entityId: string,
  source: LegacyCompatibilitySource
): unknown {
  const entity = source.entities?.[entityId];

  if (!entity) {
    throw new Error(`Legacy entity ${entityId} is not available`);
  }

  const x = finiteNumber(entity.real_x, finiteNumber(entity.x, 0));
  const y = finiteNumber(entity.real_y, finiteNumber(entity.y, 0));
  const event = createLegacyMapClickEvent({ x, y }, source);

  const handler =
    entity.npc || entity.type === "npc"
      ? source.npc_right_click
      : entity.mtype || entity.type === "monster"
        ? source.monster_click
        : source.player_click;

  if (typeof handler !== "function") {
    throw new Error(`Legacy click handler is not available for ${entityId}`);
  }

  return handler.call(entity, event);
}

export function isLegacyCompatibilitySource(
  source: unknown
): source is LegacyCompatibilitySource {
  try {
    const candidate = source as LegacyCompatibilitySource | null;
    return Boolean(
      candidate &&
      typeof candidate.map_click === "function" &&
      candidate.G &&
      typeof candidate.G === "object"
    );
  } catch {
    return false;
  }
}

function waitForLoad(frame: HTMLIFrameElement, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(
      () => reject(new Error("Timed out while loading legacy runtime iframe")),
      timeoutMs
    );

    frame.addEventListener(
      "load",
      () => {
        window.clearTimeout(timer);
        resolve();
      },
      { once: true }
    );
  });
}

async function waitForRuntimeSource(
  source: Window,
  timeoutMs: number
): Promise<LegacyCompatibilitySource> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (isLegacyCompatibilitySource(source)) {
      return source as unknown as LegacyCompatibilitySource;
    }

    await new Promise((resolve) => window.setTimeout(resolve, 25));
  }

  throw new Error(
    "Legacy iframe loaded, but Adventure Land globals did not become ready"
  );
}

/**
 * Owns the compatibility client lifecycle while keeping legacy gameplay/state
 * authoritative and presentation-only concerns outside it.
 *
 * The embedded mode intentionally requires a same-origin URL. A cross-origin
 * iframe cannot safely expose character/entities/G/map_click to the read-only
 * mirror. The deployment route behind that URL is expected to serve the pinned
 * Adventure Land client identified by PINNED_ADVENTURE_LAND_COMMIT.
 */
export class LegacyCompatibilityRuntime {
  private source: LegacyCompatibilitySource | null = null;
  private iframe: HTMLIFrameElement | null = null;
  private hiddenCanvases: HiddenCanvasState[] = [];
  private graphicsMode: GraphicsMode = "2.5d";
  private readonly hostVisibility: string;
  private readonly hostPointerEvents: string;

  constructor(
    private readonly visibleHost?: HTMLElement,
    private readonly expectedUpstreamCommit = PINNED_ADVENTURE_LAND_COMMIT
  ) {
    this.hostVisibility = visibleHost?.style.visibility ?? "";
    this.hostPointerEvents = visibleHost?.style.pointerEvents ?? "";
  }

  attach(source: LegacyCompatibilitySource): this {
    const advertisedCommit = source.__AL25D_UPSTREAM_COMMIT__;

    if (
      advertisedCommit &&
      advertisedCommit !== this.expectedUpstreamCommit
    ) {
      throw new Error(
        `Legacy runtime commit mismatch: expected ${this.expectedUpstreamCommit}, got ${advertisedCommit}`
      );
    }

    this.restoreHiddenCanvases();
    this.source = source;

    this.applyGraphicsMode();

    return this;
  }

  async embed(
    url: string,
    owner: HTMLElement = document.body,
    timeoutMs = 10000
  ): Promise<this> {
    this.stop();

    const resolved = new URL(url, window.location.href);

    if (resolved.origin !== window.location.origin) {
      throw new Error(
        "Legacy compatibility runtime must be served from the same origin"
      );
    }

    const frame = document.createElement("iframe");
    frame.dataset.al25dLegacyRuntime = "true";
    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
    Object.assign(frame.style, {
      position: "fixed",
      inset: "0",
      width: "100vw",
      height: "100vh",
      border: "0",
      opacity: "0",
      pointerEvents: "none",
      zIndex: "-1"
    });
    frame.src = resolved.href;

    this.iframe = frame;
    owner.appendChild(frame);

    try {
      await waitForLoad(frame, timeoutMs);

      const sourceWindow = frame.contentWindow;

      if (!sourceWindow) {
        throw new Error("Legacy runtime iframe has no contentWindow");
      }

      try {
        void sourceWindow.document;
      } catch {
        throw new Error(
          "Legacy compatibility runtime is not readable from this origin"
        );
      }

      const source = await waitForRuntimeSource(sourceWindow, timeoutMs);
      this.attach(source);
      return this;
    } catch (error) {
      this.stop();
      throw error;
    }
  }

  readGlobals = (): LegacyGlobalsLike => {
    return this.requireSource();
  };

  dispatchWorldClick(target: WorldPoint): unknown {
    return dispatchLegacyWorldClick(target, this.requireSource());
  }

  dispatchEntityClick(entityId: string): unknown {
    return dispatchLegacyEntityClick(entityId, this.requireSource());
  }

  setGraphicsMode(mode: GraphicsMode): void {
    this.graphicsMode = mode;
    this.applyGraphicsMode();
  }

  getGraphicsMode(): GraphicsMode {
    return this.graphicsMode;
  }

  getLegacyDocument(): Document | null {
    return this.source?.document ?? this.iframe?.contentDocument ?? null;
  }

  async enterCharacter(name: string, timeoutMs = 15000): Promise<void> {
    const source = this.requireSource();
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const entry = source.X?.characters?.find(
        (character) => character.name === name
      );

      if (
        entry?.id &&
        source.socket?.connected &&
        source.socket_welcomed &&
        typeof source.enter_selected_character === "function"
      ) {
        source.enter_selected_character(name, entry.id);

        while (Date.now() < deadline) {
          if (source.character) return;
          await new Promise((resolve) => window.setTimeout(resolve, 25));
        }

        break;
      }

      await new Promise((resolve) => window.setTimeout(resolve, 25));
    }

    throw new Error(`Legacy character ${name} did not become playable`);
  }

  stop(): void {
    this.restoreHiddenCanvases();
    this.restoreVisibleHost();

    if (this.iframe) {
      this.iframe.remove();
      this.iframe = null;
    }

    this.source = null;
    this.graphicsMode = "2.5d";
  }

  get ready(): boolean {
    return this.source !== null;
  }

  private requireSource(): LegacyCompatibilitySource {
    if (!this.source) {
      throw new Error("Legacy compatibility runtime is not attached");
    }

    return this.source;
  }

  private applyGraphicsMode(): void {
    const original = this.graphicsMode === "original";

    if (this.visibleHost) {
      this.visibleHost.style.visibility = original
        ? "hidden"
        : this.hostVisibility;
      this.visibleHost.style.pointerEvents = original
        ? "none"
        : this.hostPointerEvents;
    }

    if (this.iframe) {
      this.iframe.style.opacity = original ? "1" : "0";
      this.iframe.style.pointerEvents = original ? "auto" : "none";
      this.iframe.style.zIndex = original ? "2147482000" : "-1";
      this.iframe.tabIndex = original ? 0 : -1;

      if (original) {
        this.iframe.removeAttribute("aria-hidden");
      } else {
        this.iframe.setAttribute("aria-hidden", "true");
      }

      return;
    }

    if (original) {
      this.restoreHiddenCanvases();
    } else {
      this.hideAttachedLegacyCanvases();
    }
  }

  private restoreVisibleHost(): void {
    if (!this.visibleHost) return;
    this.visibleHost.style.visibility = this.hostVisibility;
    this.visibleHost.style.pointerEvents = this.hostPointerEvents;
  }

  private hideAttachedLegacyCanvases(): void {
    const legacyDocument = this.source?.document;

    if (!legacyDocument) return;

    for (const canvas of legacyDocument.querySelectorAll("canvas")) {
      const element = canvas as HTMLElement;

      if (this.visibleHost?.contains(element)) continue;

      this.hiddenCanvases.push(
        Object.freeze({
          element,
          visibility: element.style.visibility,
          pointerEvents: element.style.pointerEvents
        })
      );

      element.style.visibility = "hidden";
      element.style.pointerEvents = "none";
      element.dataset.al25dLegacyHidden = "true";
    }
  }

  private restoreHiddenCanvases(): void {
    for (const state of this.hiddenCanvases) {
      state.element.style.visibility = state.visibility;
      state.element.style.pointerEvents = state.pointerEvents;
      delete state.element.dataset.al25dLegacyHidden;
    }

    this.hiddenCanvases = [];
  }
}
