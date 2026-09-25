import {
  Application,
  Assets,
  Container,
  Sprite,
  Texture
} from "pixi.js";

import type {
  CameraState,
  GameFrameSnapshot,
  RenderBridge,
  RenderEntity
} from "./RenderBridge";
import { projectWorldToScreen } from "./projection";

type EntityVisual = {
  container: Container;
  sprite: Sprite;
  textureId: string;
};

const DEFAULT_CAMERA: CameraState = {
  x: 0,
  y: 0,
  zoom: 1
};

export class Pixi25DRenderer implements RenderBridge {
  private readonly app = new Application();
  private readonly world = new Container();
  private readonly visuals = new Map<string, EntityVisual>();
  private readonly pendingTextures = new Set<string>();
  private camera: CameraState = DEFAULT_CAMERA;
  private mounted = false;

  async mount(host: HTMLElement): Promise<void> {
    if (this.mounted) return;

    await this.app.init({
      resizeTo: host,
      antialias: true,
      backgroundAlpha: 0
    });

    this.world.sortableChildren = true;
    this.app.stage.addChild(this.world);
    host.appendChild(this.app.canvas);

    this.mounted = true;
    this.applyCamera();
  }

  setCamera(camera: CameraState): void {
    this.camera = camera;
    this.applyCamera();
  }

  renderFrame(snapshot: GameFrameSnapshot): void {
    if (!this.mounted) return;

    const alive = new Set<string>();

    for (const entity of snapshot.entities) {
      alive.add(entity.id);
      this.upsertEntity(entity);
    }

    for (const [id, visual] of this.visuals) {
      if (alive.has(id)) continue;
      visual.container.destroy({ children: true });
      this.visuals.delete(id);
    }
  }

  destroy(): void {
    if (!this.mounted) return;
    this.visuals.clear();
    this.app.destroy(true, { children: true });
    this.mounted = false;
  }

  private upsertEntity(entity: RenderEntity): void {
    let visual = this.visuals.get(entity.id);

    if (!visual) {
      const container = new Container();
      const sprite = new Sprite(Texture.WHITE);
      sprite.anchor.set(0.5, 1);

      container.addChild(sprite);
      this.world.addChild(container);

      visual = {
        container,
        sprite,
        textureId: ""
      };

      this.visuals.set(entity.id, visual);
    }

    if (visual.textureId !== entity.texture) {
      visual.textureId = entity.texture;
      void this.loadTexture(visual, entity.texture);
    }

    const projected = projectWorldToScreen(entity);
    visual.container.position.set(projected.x, projected.y);
    visual.container.zIndex = projected.y;

    visual.container.scale.set(entity.scale ?? 1);
    visual.container.alpha = entity.alpha ?? 1;

    // Facing is a renderer concern. Negative horizontal scale mirrors the art
    // without changing authoritative movement/direction logic.
    if (entity.facing !== undefined) {
      const magnitude = Math.abs(visual.sprite.scale.x) || 1;
      visual.sprite.scale.x = entity.facing < 0 ? -magnitude : magnitude;
    }
  }

  private async loadTexture(visual: EntityVisual, textureId: string): Promise<void> {
    if (!textureId || this.pendingTextures.has(textureId)) return;

    this.pendingTextures.add(textureId);

    try {
      const texture = await Assets.load<Texture>(textureId);

      // Ignore a late load if the entity switched textures while waiting.
      if (visual.textureId === textureId) {
        visual.sprite.texture = texture;
      }
    } catch {
      // White placeholder intentionally remains. Asset loading failure must
      // never affect gameplay state.
    } finally {
      this.pendingTextures.delete(textureId);
    }
  }

  private applyCamera(): void {
    if (!this.mounted) return;

    this.world.scale.set(this.camera.zoom);
    this.world.position.set(
      this.app.screen.width / 2 - this.camera.x * this.camera.zoom,
      this.app.screen.height / 2 - this.camera.y * this.camera.zoom
    );
  }
}
