import "./style.css";

import {
  LegacyMirrorBridge,
  type LegacyGlobalsLike
} from "./legacy/LegacyMirrorBridge";
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
    AL25D: {
      renderer: RenderBridge;
      assets: AssetRegistry;
      renderFrame: (snapshot: GameFrameSnapshot) => void;
      setCamera: (camera: CameraState) => void;
      registerAssets: (entries: readonly AssetEntry[]) => void;
      mapPointerToWorld: (point: ScreenPoint, elevation?: number) => WorldPoint;
      startLegacyMirror: (source?: LegacyGlobalsLike) => void;
      stopLegacyMirror: () => void;
    };
  }
}

async function boot(): Promise<void> {
  const host = document.querySelector<HTMLElement>("#game");

  if (!host) {
    throw new Error("Missing #game mount element");
  }

  const assets = new AssetRegistry();
  const renderer = new Pixi25DRenderer(assets);
  let camera: CameraState = { x: 0, y: 0, zoom: 1 };
  let legacyMirror: LegacyMirrorBridge | null = null;

  await renderer.mount(host);

  window.AL25D = {
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
      legacyMirror?.stop();

      const readGlobals = source
        ? () => source
        : () => window as unknown as LegacyGlobalsLike;

      legacyMirror = new LegacyMirrorBridge(renderer, readGlobals);
      legacyMirror.start();
    },
    stopLegacyMirror: () => {
      legacyMirror?.stop();
      legacyMirror = null;
    }
  };

  renderer.setCamera(camera);
  renderer.renderFrame({
    tick: 0,
    map: "main",
    entities: []
  });
}

void boot();
