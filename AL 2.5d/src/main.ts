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
import { CUSTOM_ENTITY_ASSETS } from "./render/CustomEntityArt";
import { viewportToWorld, worldToViewport } from "./render/camera";
import {
  rotateCameraByDrag,
  zoomCameraByWheel
} from "./render/cameraControls";
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
import { CombatFeedbackOverlay } from "./ui/CombatFeedbackOverlay";
import { HudOverlay } from "./ui/HudOverlay";
import { MinimapOverlay } from "./ui/MinimapOverlay";

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

  const assets = new AssetRegistry(CUSTOM_ENTITY_ASSETS);
  const renderer = new Pixi25DRenderer(assets);
  const storedZoom = Number(window.localStorage.getItem("al25d.cameraZoom"));
  const storedRotation = Number(
    window.localStorage.getItem("al25d.cameraRotation")
  );
  let camera: CameraState = {
    x: 0,
    y: 0,
    zoom:
      Number.isFinite(storedZoom) && storedZoom > 0
        ? storedZoom
        : 1.5,
    rotation: Number.isFinite(storedRotation) ? storedRotation : 0
  };
  let legacyMirror: LegacyMirrorBridge | null = null;
  let legacyRuntime: LegacyCompatibilityRuntime | null = null;
  let latestSnapshot: GameFrameSnapshot | null = null;
  let graphicsMode: GraphicsMode =
    window.localStorage.getItem("al25d.graphicsMode") === "original"
      ? "original"
      : "2.5d";
  let minimapVisible = window.localStorage.getItem("al25d.minimapVisible") !== "0";
  let combatVfxVisible = window.localStorage.getItem("al25d.combatVfxVisible") !== "0";
  let graphicsToggle: GraphicsModeToggle;

  await renderer.mount(host);

  const combatFeedback = new CombatFeedbackOverlay(document.body);
  combatFeedback.setMode(graphicsMode);
  combatFeedback.setEnabled(combatVfxVisible);

  const minimap = new MinimapOverlay(document.body);
  minimap.setMode(graphicsMode);
  minimap.setEnabled(minimapVisible);

  const showLocalActionFeedback = (key: string): void => {
    const local = latestSnapshot?.entities.find((entity) => entity.local);
    if (!local) return;

    const hotbarEntry = latestSnapshot?.playerUi?.hotbar.find(
      (entry) => entry.key === key
    );
    combatFeedback.action(
      local,
      key,
      camera,
      {
        width: host.clientWidth,
        height: host.clientHeight
      },
      hotbarEntry?.visualKind ?? "utility"
    );
    renderer.playEntityAction(
      local.id,
      hotbarEntry?.action === "attack" ? "attack" : "cast"
    );
  };

  const hud = new HudOverlay(
    {
      onHotbar: (key) => {
        if (!legacyRuntime?.ready) return;
        try {
          const result = legacyRuntime.dispatchHotbarKey(key);
          showLocalActionFeedback(key);
          if (result instanceof Promise) {
            void result.catch((error) =>
              console.warn("AL 2.5D hotbar action failed", error)
            );
          }
        } catch (error) {
          console.warn("AL 2.5D hotbar action was not dispatched", error);
        }
      },
      onToggleMinimap: (visible) => {
        minimapVisible = visible;
        window.localStorage.setItem("al25d.minimapVisible", visible ? "1" : "0");
        minimap.setEnabled(visible);
      },
      onToggleCombatVfx: (visible) => {
        combatVfxVisible = visible;
        window.localStorage.setItem("al25d.combatVfxVisible", visible ? "1" : "0");
        combatFeedback.setEnabled(visible);
      },
      onCameraZoom: (zoom) => {
        camera = { ...camera, zoom };
        renderer.setCamera(camera);
        window.localStorage.setItem("al25d.cameraZoom", String(zoom));
      },
      onResetView: () => {
        camera = { ...camera, zoom: 1.5, rotation: 0 };
        renderer.setCamera(camera);
        window.localStorage.setItem("al25d.cameraZoom", "1.5");
        window.localStorage.setItem("al25d.cameraRotation", "0");
      },
      onInventoryEquip: (index) => {
        if (!legacyRuntime?.ready) {
          throw new Error("Original Adventure Land runtime is not ready");
        }
        return legacyRuntime.dispatchInventoryEquip(index);
      },
      onInventorySwap: (from, to) => {
        if (!legacyRuntime?.ready) {
          throw new Error("Original Adventure Land runtime is not ready");
        }
        return legacyRuntime.dispatchInventorySwap(from, to);
      },
      onEquipmentUnequip: (slot) => {
        if (!legacyRuntime?.ready) {
          throw new Error("Original Adventure Land runtime is not ready");
        }
        return legacyRuntime.dispatchEquipmentUnequip(slot);
      },
      onChatSend: (request) => {
        if (!legacyRuntime?.ready) {
          throw new Error("Original Adventure Land runtime is not ready");
        }
        return legacyRuntime.dispatchChatMessage(request);
      }
    },
    document.body
  );
  hud.setMode(graphicsMode);
  hud.setPresentationSettings({
    minimapVisible,
    combatVfxVisible,
    cameraZoom: camera.zoom,
    cameraRotation: camera.rotation ?? 0
  });

  const cameraHelp = document.createElement("div");
  cameraHelp.id = "al25d-camera-help";
  cameraHelp.textContent = "MMB drehen · Mausrad zoomen";
  cameraHelp.hidden = graphicsMode !== "2.5d";
  document.body.appendChild(cameraHelp);

  graphicsToggle = new GraphicsModeToggle((nextMode) => {
    graphicsMode = nextMode;
    window.localStorage.setItem("al25d.graphicsMode", nextMode);
    legacyRuntime?.setGraphicsMode(nextMode);
    graphicsToggle.setMode(nextMode);
    hud.setMode(nextMode);
    combatFeedback.setMode(nextMode);
    minimap.setMode(nextMode);
    cameraHelp.hidden = nextMode !== "2.5d";
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

        if (local) {
          const projected = projectWorldToScreen(local);
          camera = {
            ...camera,
            x: projected.x,
            y: projected.y
          };
          renderer.setCamera(camera);
        }

        hud.render(snapshot);
        minimap.render(snapshot);
        combatFeedback.render(snapshot, camera, {
          width: host.clientWidth,
          height: host.clientHeight
        });
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
    renderFrame: (snapshot) => {
      latestSnapshot = snapshot;
      hud.render(snapshot);
      minimap.render(snapshot);
      combatFeedback.render(snapshot, camera, {
        width: host.clientWidth,
        height: host.clientHeight
      });
      renderer.renderFrame(snapshot);
    },
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
      hud.clear();
      minimap.clear();
      combatFeedback.clear();
      graphicsToggle.dockToLegacyUi(null);
      graphicsToggle.setReady(false);
    },
    legacyRuntimeReady: () => legacyRuntime?.ready ?? false,
    setGraphicsMode: (mode) => {
      graphicsMode = mode;
      window.localStorage.setItem("al25d.graphicsMode", mode);
      legacyRuntime?.setGraphicsMode(mode);
      graphicsToggle.setMode(mode);
      hud.setMode(mode);
      combatFeedback.setMode(mode);
      minimap.setMode(mode);
      cameraHelp.hidden = mode !== "2.5d";
    },
    getGraphicsMode: () => graphicsMode
  };

  window.AL25D = api;

  let cameraDrag: Readonly<{
    pointerId: number;
    lastX: number;
  }> | null = null;

  const persistCameraView = (): void => {
    window.localStorage.setItem("al25d.cameraZoom", String(camera.zoom));
    window.localStorage.setItem(
      "al25d.cameraRotation",
      String(camera.rotation ?? 0)
    );
    hud.setPresentationSettings({
      minimapVisible,
      combatVfxVisible,
      cameraZoom: camera.zoom,
      cameraRotation: camera.rotation ?? 0
    });
  };

  const findEntityHit = (clientX: number, clientY: number) => {
    const rect = host.getBoundingClientRect();
    const point = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
    const viewport = {
      width: rect.width,
      height: rect.height
    };

    const hit = latestSnapshot?.entities
      .filter(
        (entity) =>
          !entity.local &&
          (
            entity.interaction?.kind === "loot-chest" ||
            entity.kind === "player" ||
            entity.kind === "monster" ||
            entity.kind === "npc"
          )
      )
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

    return { rect, point, viewport, hit };
  };

  host.addEventListener("pointerdown", (event) => {
    if (graphicsMode !== "2.5d" || event.button !== 1) return;

    event.preventDefault();
    cameraDrag = Object.freeze({
      pointerId: event.pointerId,
      lastX: event.clientX
    });
    host.setPointerCapture?.(event.pointerId);
    host.classList.add("al25d-camera-dragging");
  });

  host.addEventListener("pointermove", (event) => {
    if (!cameraDrag || cameraDrag.pointerId !== event.pointerId) return;

    event.preventDefault();
    const deltaX = event.clientX - cameraDrag.lastX;
    cameraDrag = Object.freeze({
      pointerId: event.pointerId,
      lastX: event.clientX
    });

    if (deltaX !== 0) {
      camera = rotateCameraByDrag(camera, deltaX);
      renderer.setCamera(camera);
      persistCameraView();
    }
  });

  const stopCameraDrag = (event: PointerEvent): void => {
    if (!cameraDrag || cameraDrag.pointerId !== event.pointerId) return;

    event.preventDefault();
    try {
      host.releasePointerCapture?.(event.pointerId);
    } catch {
      // Capture may already be released by the browser.
    }
    cameraDrag = null;
    host.classList.remove("al25d-camera-dragging");
  };

  host.addEventListener("pointercancel", stopCameraDrag);

  host.addEventListener("pointerup", (event) => {
    if (event.button === 1) {
      stopCameraDrag(event);
      return;
    }

    if (!legacyRuntime?.ready || event.button !== 0) return;

    const { rect, point, viewport, hit } =
      findEntityHit(event.clientX, event.clientY);
    try {
      if (hit) {
        if (hit.entity.interaction?.kind === "loot-chest") {
          legacyRuntime.dispatchChestLoot(hit.entity.interaction.id);
        } else {
          legacyRuntime.dispatchEntityClick(hit.entity.id);
        }
        event.preventDefault();
        return;
      }

      const world = viewportToWorld(point, camera, viewport, 0);
      legacyRuntime.dispatchWorldClick(world);
    } catch (error) {
      console.warn("AL 2.5D legacy pointer action was not dispatched", error);
    }
  });

  host.addEventListener(
    "wheel",
    (event) => {
      if (graphicsMode !== "2.5d") return;

      event.preventDefault();
      camera = zoomCameraByWheel(camera, event.deltaY);
      renderer.setCamera(camera);
      persistCameraView();
    },
    { passive: false }
  );

  host.addEventListener("auxclick", (event) => {
    if (graphicsMode === "2.5d" && event.button === 1) {
      event.preventDefault();
    }
  });

  host.addEventListener("contextmenu", (event) => {
    if (!legacyRuntime?.ready || graphicsMode !== "2.5d") return;

    event.preventDefault();

    const { hit } = findEntityHit(event.clientX, event.clientY);
    if (!hit) return;

    try {
      if (hit.entity.interaction?.kind === "loot-chest") {
        legacyRuntime.dispatchChestLoot(hit.entity.interaction.id);
        return;
      }

      legacyRuntime.dispatchEntityRightClick(hit.entity.id);
      const local = latestSnapshot?.entities.find((entity) => entity.local);
      if (local) {
        renderer.playEntityAction(local.id, "attack");
        combatFeedback.attack(local, hit.entity, camera, {
          width: host.clientWidth,
          height: host.clientHeight
        });
      } else {
        combatFeedback.pulse(hit.entity, camera, {
          width: host.clientWidth,
          height: host.clientHeight
        });
      }
    } catch (error) {
      console.warn(
        "AL 2.5D legacy right-click action was not dispatched",
        error
      );
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
          hud.setMode("original");
          combatFeedback.setMode("original");
          minimap.setMode("original");
          cameraHelp.hidden = true;
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
