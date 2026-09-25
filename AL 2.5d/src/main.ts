import "./style.css";

import {
  isLegacyCompatibilitySource,
  LegacyCompatibilityRuntime,
  type GraphicsMode,
  type LegacyCompatibilitySource
} from "./legacy/LegacyCompatibilityRuntime";
import {
  LegacyMirrorBridge,
  type LegacyGlobalsLike
} from "./legacy/LegacyMirrorBridge";
import {
  ensureLocalAdminSession,
  isLoopbackHostname
} from "./local/LocalAdminSandbox";
import { AssetRegistry, type AssetEntry } from "./render/AssetRegistry";
import { viewportToWorld, worldToViewport } from "./render/camera";
import { Pixi25DRenderer } from "./render/Pixi25DRenderer";
import type {
  CameraState,
  GameFrameSnapshot,
  RenderBridge
} from "./render/RenderBridge";
import {
  projectWorldToScreen,
  type ScreenPoint,
  type WorldPoint
} from "./render/projection";
import { GraphicsModeToggle } from "./ui/GraphicsModeToggle";

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
      setGraphicsMode: (mode: GraphicsMode) => void;
      getGraphicsMode: () => GraphicsMode;
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
  let camera: CameraState = { x: 0, y: 0, zoom: 1.5 };
  let legacyMirror: LegacyMirrorBridge | null = null;
  let legacyRuntime: LegacyCompatibilityRuntime | null = null;
  let latestSnapshot: GameFrameSnapshot | null = null;
  let graphicsMode: GraphicsMode =
    window.localStorage.getItem("al25d.graphicsMode") === "original"
      ? "original"
      : "2.5d";
  let graphicsToggle: GraphicsModeToggle;

  await renderer.mount(host);

  graphicsToggle = new GraphicsModeToggle((nextMode) => {
    graphicsMode = nextMode;
    window.localStorage.setItem("al25d.graphicsMode", nextMode);
    legacyRuntime?.setGraphicsMode(nextMode);
    graphicsToggle.setMode(nextMode);
  });
  graphicsToggle.setMode(graphicsMode);

  const startMirror = (readGlobals: () => LegacyGlobalsLike): void => {
    legacyMirror?.stop();
    legacyMirror = new LegacyMirrorBridge(
      renderer,
      readGlobals,
      undefined,
      undefined,
      (snapshot) => {
        latestSnapshot = snapshot;
        const local = snapshot.entities.find((entity) => entity.local);
        if (!local) return;

        const projected = projectWorldToScreen(local);
        camera = {
          x: projected.x,
          y: projected.y,
          zoom: camera.zoom
        };
        renderer.setCamera(camera);
      }
    );
    legacyMirror.start();
  };

  const activateLegacyRuntime = (
    runtime: LegacyCompatibilityRuntime
  ): void => {
    if (legacyRuntime && legacyRuntime !== runtime) {
      legacyRuntime.stop();
    }

    legacyRuntime = runtime;
    runtime.setGraphicsMode(graphicsMode);
    graphicsToggle.setMode(graphicsMode);
    graphicsToggle.setReady(true);
    graphicsToggle.dockToLegacyUi(runtime.getLegacyDocument());
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
      graphicsToggle.dockToLegacyUi(null);
      graphicsToggle.setReady(false);
    },
    legacyRuntimeReady: () => legacyRuntime?.ready ?? false,
    setGraphicsMode: (mode) => {
      graphicsMode = mode;
      window.localStorage.setItem("al25d.graphicsMode", mode);
      legacyRuntime?.setGraphicsMode(mode);
      graphicsToggle.setMode(mode);
    },
    getGraphicsMode: () => graphicsMode
  };

  window.AL25D = api;

  host.addEventListener("pointerup", (event) => {
    if (!legacyRuntime?.ready) return;

    const rect = host.getBoundingClientRect();
    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    const viewport = {
      width: rect.width,
      height: rect.height
    };

    const hit = latestSnapshot?.entities
      .filter((entity) => !entity.local)
      .map((entity) => {
        const screen = worldToViewport(entity, camera, viewport);
        const dx = point.x - screen.x;
        const dy = point.y - (screen.y - 20 * camera.zoom);
        const rx = 22 * camera.zoom;
        const ry = 30 * camera.zoom;
        const score = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
        return { entity, score };
      })
      .filter((candidate) => candidate.score <= 1)
      .sort((a, b) => a.score - b.score)[0];

    try {
      if (hit) {
        legacyRuntime.dispatchEntityClick(hit.entity.id);
        event.preventDefault();
        return;
      }

      const world = viewportToWorld(point, camera, viewport, 0);
      legacyRuntime.dispatchWorldClick(world);
    } catch (error) {
      console.warn("AL 2.5D legacy pointer action was not dispatched", error);
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
          graphicsMode = "original";
          graphicsToggle.setMode("original");
        }

        const runtime = new LegacyCompatibilityRuntime(host);
        await runtime.embed(legacyUrl);
        activateLegacyRuntime(runtime);
      } catch (error) {
        console.error("AL 2.5D legacy compatibility runtime failed", error);
      }
    })();
  }
}

void boot();
