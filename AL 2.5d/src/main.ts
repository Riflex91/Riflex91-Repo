import "./style.css";

import { Pixi25DRenderer } from "./render/Pixi25DRenderer";
import type {
  CameraState,
  GameFrameSnapshot,
  RenderBridge
} from "./render/RenderBridge";

declare global {
  interface Window {
    AL25D: {
      renderer: RenderBridge;
      renderFrame: (snapshot: GameFrameSnapshot) => void;
      setCamera: (camera: CameraState) => void;
    };
  }
}

async function boot(): Promise<void> {
  const host = document.querySelector<HTMLElement>("#game");

  if (!host) {
    throw new Error("Missing #game mount element");
  }

  const renderer = new Pixi25DRenderer();
  await renderer.mount(host);

  window.AL25D = {
    renderer,
    renderFrame: (snapshot) => renderer.renderFrame(snapshot),
    setCamera: (camera) => renderer.setCamera(camera)
  };

  renderer.setCamera({ x: 0, y: 0, zoom: 1 });
  renderer.renderFrame({
    tick: 0,
    map: "main",
    entities: []
  });
}

void boot();
