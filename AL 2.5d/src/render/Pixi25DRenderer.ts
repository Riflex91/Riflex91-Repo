import {
  Application,
  Assets,
  Container,
  Sprite,
  Texture
} from "pixi.js";

import { AssetRegistry } from "./AssetRegistry";
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
  assetId: string;
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
  private readonly textureLoads = new Map<string, Promise<Texture | null>>();
  private camera: CameraState = DEFAULT_CAMERA;
  private mounted = false;

  constructor(private readonly assets = new AssetRegistry()) {}

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
    if (camera.zoom <= 0) {
      throw new Error("Camera zoom must be greater than zero");
    }

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
    this.textureLoads.clear();
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
        assetId: ""
      };

      this.visuals.set(entity.id, visual);
    }

    if (visual.assetId !== entity.texture) {
      visual.assetId = entity.texture;
      visual.sprite.texture = Texture.WHITE;
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

  private async loadTexture(
    visual: EntityVisual,
    assetId: string
  ): Promise<void> {
    const src = this.assets.resolve(assetId);

    if (!src) {
      return;
    }

    let load = this.textureLoads.get(src);

    if (!load) {
      load = Assets.load<Texture>(src).catch(() => null);
      this.textureLoads.set(src, load);
    }

    const texture = await load;

    // Ignore a late load if the entity switched assets while waiting.
    if (texture && visual.assetId === assetId) {
      visual.sprite.texture = texture;
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
