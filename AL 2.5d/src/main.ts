import "./style.css";

import {
  isLegacyCompatibilitySource,
  LegacyCompatibilityRuntime,
  type LegacyCompatibilitySource
} from "./legacy/LegacyCompatibilityRuntime";
import {
  LegacyMirrorBridge,
  type LegacyGlobalsLike
} from "./legacy/LegacyMirrorBridge";
import {
  ensureLocalAdminSession,
  isLoopbackHostname,
  LOCAL_ADMIN_CHARACTER
} from "./local/LocalAdminSandbox";
import { AssetRegistry, type AssetEntry } from "./render/AssetRegistry";
import { viewportToWorld } from "./render/camera";
import { Pixi25DRenderer } from "./render/Pixi25DRenderer";
import type {
  CameraState,
  GameFrameSnapshot,
  RenderBridge
} from "./render/RenderBridge";
import type { ScreenPoint, WorldPoint } from "./render/projection";

declare global {
  interface Window {
    AL25D_LEGACY_URL?: string;
    AL25D: {
      renderer: RenderBridge;
      assets: AssetRegistry;
      renderFrame: (snapshot: GameFrameSnapshot) => void;
      setCamera: (camera: CameraState) => void;
      registerAssets: (entries: readonly AssetEntry[]) => void;
      mapPointerToWorld: (point: ScreenPoint, elevation?: number) => WorldPoint;
      startLegacyMirror: (source?: LegacyGlobalsLike) => void;
      stopLegacyMirror: () => void;
      attachLegacyRuntime: (source?: LegacyCompatibilitySource) => void;
      embedLegacyRuntime: (url: string) => Promise<void>;
      stopLegacyRuntime: () => void;
      legacyRuntimeReady: () => boolean;
    };
  }
}

function createAttachedOverlayHost(): HTMLElement {
  const host = document.createElement("div");
  host.id = "al25d-attached-renderer";
  Object.assign(host.style, {
    position: "fixed",
    inset: "0",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    zIndex: "2147483000",
    pointerEvents: "auto"
  });
  document.body.appendChild(host);
  return host;
}

async function boot(): Promise<void> {
  const attachedLegacySource = isLegacyCompatibilitySource(window)
    ? (window as unknown as LegacyCompatibilitySource)
    : null;
  const host = attachedLegacySource
    ? createAttachedOverlayHost()
    : document.querySelector<HTMLElement>("#game");

  if (!host) {
    throw new Error("Missing #game mount element");
  }

  const assets = new AssetRegistry();
  const renderer = new Pixi25DRenderer(assets);
  let camera: CameraState = { x: 0, y: 0, zoom: 1 };
  let legacyMirror: LegacyMirrorBridge | null = null;
  let legacyRuntime: LegacyCompatibilityRuntime | null = null;

  await renderer.mount(host);

  const startMirror = (readGlobals: () => LegacyGlobalsLike): void => {
    legacyMirror?.stop();
    legacyMirror = new LegacyMirrorBridge(renderer, readGlobals);
    legacyMirror.start();
  };

  const activateLegacyRuntime = (
    runtime: LegacyCompatibilityRuntime
  ): void => {
    if (legacyRuntime && legacyRuntime !== runtime) {
      legacyRuntime.stop();
    }

    legacyRuntime = runtime;
    startMirror(runtime.readGlobals);
  };

  const api: Window["AL25D"] = {
    renderer,
    assets,
    renderFrame: (snapshot) => renderer.renderFrame(snapshot),
    setCamera: (nextCamera) => {
      camera = nextCamera;
      renderer.setCamera(nextCamera);
    },
    registerAssets: (entries) => assets.registerMany(entries),
    mapPointerToWorld: (point, elevation = 0) =>
      viewportToWorld(
        point,
        camera,
        {
          width: host.clientWidth,
          height: host.clientHeight
        },
        elevation
      ),
    startLegacyMirror: (source) => {
      const readGlobals = source
        ? () => source
        : () => window as unknown as LegacyGlobalsLike;

      startMirror(readGlobals);
    },
    stopLegacyMirror: () => {
      legacyMirror?.stop();
      legacyMirror = null;
    },
    attachLegacyRuntime: (source) => {
      const runtime = new LegacyCompatibilityRuntime(host).attach(
        source ?? (window as unknown as LegacyCompatibilitySource)
      );
      activateLegacyRuntime(runtime);
    },
    embedLegacyRuntime: async (url) => {
      const runtime = new LegacyCompatibilityRuntime(host);
      await runtime.embed(url);
      activateLegacyRuntime(runtime);
    },
    stopLegacyRuntime: () => {
      legacyMirror?.stop();
      legacyMirror = null;
      legacyRuntime?.stop();
      legacyRuntime = null;
    },
    legacyRuntimeReady: () => legacyRuntime?.ready ?? false
  };

  window.AL25D = api;

  host.addEventListener("pointerup", (event) => {
    if (!legacyRuntime?.ready) return;

    const rect = host.getBoundingClientRect();
    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    const world = viewportToWorld(
      point,
      camera,
      {
        width: rect.width,
        height: rect.height
      },
      0
    );

    try {
      legacyRuntime.dispatchWorldClick(world);
    } catch (error) {
      console.warn("AL 2.5D legacy map click was not dispatched", error);
    }
  });

  renderer.setCamera(camera);
  renderer.renderFrame({
    tick: 0,
    map: "main",
    entities: []
  });

  if (attachedLegacySource) {
    api.attachLegacyRuntime(attachedLegacySource);
    return;
  }

  const search = new URLSearchParams(window.location.search);
  const localAdminRequested = search.get("localAdmin") === "1";

  if (localAdminRequested && !isLoopbackHostname(window.location.hostname)) {
    throw new Error("Local admin sandbox can only run on localhost");
  }

  const legacyUrl =
    window.AL25D_LEGACY_URL ??
    search.get("legacy") ??
    (localAdminRequested ? "/legacy/" : null);

  if (legacyUrl) {
    void (async () => {
      try {
        if (localAdminRequested) {
          await ensureLocalAdminSession();
        }

        const runtime = new LegacyCompatibilityRuntime(host);
        await runtime.embed(legacyUrl);
        activateLegacyRuntime(runtime);

        if (localAdminRequested) {
          await runtime.enterCharacter(LOCAL_ADMIN_CHARACTER);
        }
      } catch (error) {
        console.error("AL 2.5D legacy compatibility runtime failed", error);
      }
    })();
  }
}

void boot();
