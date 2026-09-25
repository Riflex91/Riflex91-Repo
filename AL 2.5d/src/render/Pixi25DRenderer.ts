import {
  Application,
  Assets,
  Container,
  Graphics,
  Sprite,
  Text,
  Texture
} from "pixi.js";

import { AssetRegistry } from "./AssetRegistry";
import type {
  CameraState,
  EntityKind,
  GameFrameSnapshot,
  RenderBridge,
  RenderEntity,
  RenderMapBounds
} from "./RenderBridge";
import { resolveHudVisibility } from "./hudLayout";
import { projectWorldToScreen } from "./projection";

type EntityVisual = {
  container: Container;
  sprite: Sprite;
  fallback: Graphics;
  ui: Graphics;
  label: Text;
  assetId: string;
  kind: EntityKind;
  uiKey: string;
};

const DEFAULT_CAMERA: CameraState = {
  x: 0,
  y: 0,
  zoom: 1.35
};

const FALLBACK_BOUNDS_SIZE = 1800;
const GRID_STEP = 128;

export class Pixi25DRenderer implements RenderBridge {
  private readonly app = new Application();
  private readonly world = new Container();
  private readonly mapLayer = new Container();
  private readonly visuals = new Map<string, EntityVisual>();
  private readonly textureLoads = new Map<string, Promise<Texture | null>>();
  private camera: CameraState = DEFAULT_CAMERA;
  private mounted = false;
  private mapVisualKey = "";

  constructor(private readonly assets = new AssetRegistry()) {}

  async mount(host: HTMLElement): Promise<void> {
    if (this.mounted) return;

    await this.app.init({
      resizeTo: host,
      antialias: true,
      background: 0x0d1110,
      backgroundAlpha: 1
    });

    this.world.sortableChildren = true;
    this.mapLayer.zIndex = -1000000;
    this.world.addChild(this.mapLayer);
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

    this.renderMap(snapshot);

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

    this.applyHudDeclutter(snapshot.entities);
  }

  destroy(): void {
    if (!this.mounted) return;
    this.visuals.clear();
    this.textureLoads.clear();
    this.app.destroy(true, { children: true });
    this.mounted = false;
    this.mapVisualKey = "";
  }

  private renderMap(snapshot: GameFrameSnapshot): void {
    const geometry = snapshot.mapState?.geometry;
    const bounds = this.resolveBounds(snapshot);
    const key = [
      snapshot.map,
      geometry?.xLines ?? 0,
      geometry?.yLines ?? 0,
      bounds.minX,
      bounds.minY,
      bounds.maxX,
      bounds.maxY
    ].join(":");

    if (key === this.mapVisualKey) return;
    this.mapVisualKey = key;

    for (const child of this.mapLayer.removeChildren()) {
      child.destroy({ children: true });
    }

    const floor = new Graphics();
    const corners = [
      projectWorldToScreen({ x: bounds.minX, y: bounds.minY }),
      projectWorldToScreen({ x: bounds.maxX, y: bounds.minY }),
      projectWorldToScreen({ x: bounds.maxX, y: bounds.maxY }),
      projectWorldToScreen({ x: bounds.minX, y: bounds.maxY })
    ];

    floor
      .poly(corners.flatMap((point) => [point.x, point.y]))
      .fill({ color: 0x17231f, alpha: 1 })
      .stroke({ color: 0x315045, width: 2, alpha: 0.9 });

    this.drawGrid(floor, bounds);
    this.mapLayer.addChild(floor);

    const walls = new Graphics();
    for (const [x, y1, y2] of geometry?.collisionXLines ?? []) {
      this.drawCollisionWall(walls, { x, y: y1 }, { x, y: y2 });
    }
    for (const [y, x1, x2] of geometry?.collisionYLines ?? []) {
      this.drawCollisionWall(walls, { x: x1, y }, { x: x2, y });
    }
    this.mapLayer.addChild(walls);
  }

  private resolveBounds(snapshot: GameFrameSnapshot): RenderMapBounds {
    const explicit = snapshot.mapState?.geometry.bounds;
    if (
      explicit &&
      explicit.maxX > explicit.minX &&
      explicit.maxY > explicit.minY
    ) {
      return this.padBounds(explicit, 96);
    }

    const local = snapshot.entities.find((entity) => entity.local);
    const centerX = local?.x ?? 0;
    const centerY = local?.y ?? 0;
    const half = FALLBACK_BOUNDS_SIZE / 2;

    return {
      minX: centerX - half,
      minY: centerY - half,
      maxX: centerX + half,
      maxY: centerY + half
    };
  }

  private padBounds(bounds: RenderMapBounds, padding: number): RenderMapBounds {
    return {
      minX: bounds.minX - padding,
      minY: bounds.minY - padding,
      maxX: bounds.maxX + padding,
      maxY: bounds.maxY + padding
    };
  }

  private drawGrid(graphics: Graphics, bounds: RenderMapBounds): void {
    const spanX = bounds.maxX - bounds.minX;
    const spanY = bounds.maxY - bounds.minY;
    const xStride =
      GRID_STEP * Math.max(1, Math.ceil(spanX / GRID_STEP / 72));
    const yStride =
      GRID_STEP * Math.max(1, Math.ceil(spanY / GRID_STEP / 72));

    const firstX = Math.ceil(bounds.minX / xStride) * xStride;
    const firstY = Math.ceil(bounds.minY / yStride) * yStride;

    for (let x = firstX; x <= bounds.maxX; x += xStride) {
      const a = projectWorldToScreen({ x, y: bounds.minY });
      const b = projectWorldToScreen({ x, y: bounds.maxY });
      graphics
        .moveTo(a.x, a.y)
        .lineTo(b.x, b.y)
        .stroke({ color: 0x294038, width: 1, alpha: 0.45 });
    }

    for (let y = firstY; y <= bounds.maxY; y += yStride) {
      const a = projectWorldToScreen({ x: bounds.minX, y });
      const b = projectWorldToScreen({ x: bounds.maxX, y });
      graphics
        .moveTo(a.x, a.y)
        .lineTo(b.x, b.y)
        .stroke({ color: 0x294038, width: 1, alpha: 0.45 });
    }
  }

  private drawCollisionWall(
    graphics: Graphics,
    start: { x: number; y: number },
    end: { x: number; y: number }
  ): void {
    const a = projectWorldToScreen(start);
    const b = projectWorldToScreen(end);
    const height = 13;

    graphics
      .poly([
        a.x,
        a.y,
        b.x,
        b.y,
        b.x,
        b.y - height,
        a.x,
        a.y - height
      ])
      .fill({ color: 0x385248, alpha: 0.6 })
      .stroke({ color: 0x6f9587, width: 1, alpha: 0.75 });
  }

  private upsertEntity(entity: RenderEntity): void {
    let visual = this.visuals.get(entity.id);

    if (!visual) {
      const container = new Container();
      const sprite = new Sprite(Texture.WHITE);
      const fallback = new Graphics();
      const ui = new Graphics();
      const label = new Text({
        text: "",
        style: {
          fontFamily: "Arial, sans-serif",
          fontSize: 10,
          fill: 0xffffff,
          stroke: { color: 0x000000, width: 3 },
          align: "center"
        }
      });
      sprite.anchor.set(0.5, 1);
      sprite.visible = false;
      label.anchor.set(0.5, 1);

      container.addChild(fallback);
      container.addChild(sprite);
      container.addChild(ui);
      container.addChild(label);
      this.world.addChild(container);

      visual = {
        container,
        sprite,
        fallback,
        ui,
        label,
        assetId: "",
        kind: entity.kind,
        uiKey: ""
      };

      this.drawFallback(fallback, entity.kind, Boolean(entity.local));
      this.visuals.set(entity.id, visual);
    } else if (visual.kind !== entity.kind) {
      visual.kind = entity.kind;
      this.drawFallback(visual.fallback, entity.kind, Boolean(entity.local));
    }

    if (visual.assetId !== entity.texture) {
      visual.assetId = entity.texture;
      const src = this.assets.resolve(entity.texture);

      if (src) {
        visual.sprite.visible = false;
        visual.fallback.visible = true;
        void this.loadTexture(visual, entity.texture);
      } else {
        visual.sprite.visible = false;
        visual.fallback.visible = true;
      }
    }

    const projected = projectWorldToScreen(entity);
    visual.container.position.set(projected.x, projected.y);
    visual.container.zIndex = projected.y;

    visual.container.scale.set(entity.scale ?? 1);
    visual.container.alpha = entity.alpha ?? 1;

    const facing = entity.facing !== undefined && entity.facing < 0 ? -1 : 1;
    visual.sprite.scale.x = facing;
    visual.fallback.scale.x = facing;

    const uiKey = [
      entity.name ?? entity.id,
      entity.hp ?? "",
      entity.maxHp ?? "",
      entity.mp ?? "",
      entity.maxMp ?? "",
      entity.targeted ? 1 : 0,
      entity.local ? 1 : 0
    ].join("|");

    if (visual.uiKey !== uiKey) {
      visual.uiKey = uiKey;
      this.drawEntityUi(visual, entity);
    }
  }

  private drawFallback(
    graphics: Graphics,
    kind: EntityKind,
    local: boolean
  ): void {
    graphics.clear();

    graphics
      .ellipse(0, 2, 13, 5)
      .fill({ color: 0x000000, alpha: 0.35 });

    if (kind === "monster") {
      graphics
        .ellipse(0, -11, 13, 11)
        .fill({ color: 0xb75252, alpha: 1 })
        .stroke({ color: 0xf0997f, width: 2, alpha: 0.95 });
      graphics
        .circle(-4, -14, 2)
        .fill({ color: 0xf5e6cf, alpha: 1 });
      graphics
        .circle(4, -14, 2)
        .fill({ color: 0xf5e6cf, alpha: 1 });
      return;
    }

    if (kind === "npc") {
      graphics
        .roundRect(-10, -31, 20, 29, 6)
        .fill({ color: 0xc69b45, alpha: 1 })
        .stroke({ color: 0xf2d184, width: 2, alpha: 0.95 });
      graphics
        .circle(0, -35, 7)
        .fill({ color: 0xe1b86f, alpha: 1 });
      return;
    }

    if (kind === "player") {
      const bodyColor = local ? 0x4f9fd7 : 0x6e86a8;
      graphics
        .roundRect(-10, -32, 20, 30, 7)
        .fill({ color: bodyColor, alpha: 1 })
        .stroke({
          color: local ? 0xa8e6ff : 0xb7c6db,
          width: local ? 3 : 2,
          alpha: 1
        });
      graphics
        .circle(0, -37, 7)
        .fill({ color: 0xd8b08a, alpha: 1 });
      if (local) {
        graphics
          .circle(0, -17, 16)
          .stroke({ color: 0x7fdcff, width: 1.5, alpha: 0.75 });
      }
      return;
    }

    graphics
      .poly([0, -24, 13, -10, 0, 0, -13, -10])
      .fill({ color: 0x7a817d, alpha: 1 })
      .stroke({ color: 0xb0b8b3, width: 2, alpha: 0.8 });
  }

  private drawEntityUi(
    visual: EntityVisual,
    entity: RenderEntity
  ): void {
    const ui = visual.ui;
    ui.clear();

    if (entity.targeted) {
      ui
        .ellipse(0, 3, 20, 7)
        .stroke({ color: 0xffd45a, width: 3, alpha: 1 });
    }

    const maxHp =
      entity.maxHp !== undefined && entity.maxHp > 0
        ? entity.maxHp
        : undefined;
    const showHp =
      maxHp !== undefined &&
      entity.hp !== undefined &&
      (Boolean(entity.local) ||
        entity.kind === "player" ||
        Boolean(entity.targeted));

    if (showHp && maxHp !== undefined && entity.hp !== undefined) {
      const width = 38;
      const ratio = Math.max(0, Math.min(1, entity.hp / maxHp));
      ui
        .roundRect(-width / 2, -49, width, 5, 2)
        .fill({ color: 0x101010, alpha: 0.9 });
      ui
        .roundRect(-width / 2 + 1, -48, (width - 2) * ratio, 3, 1)
        .fill({ color: 0x55c56b, alpha: 1 });
    }

    const showMp =
      entity.maxMp !== undefined &&
      entity.maxMp > 0 &&
      entity.mp !== undefined &&
      (entity.local || entity.kind === "player");

    if (showMp && entity.maxMp !== undefined && entity.mp !== undefined) {
      const width = 38;
      const ratio = Math.max(0, Math.min(1, entity.mp / entity.maxMp));
      ui
        .roundRect(-width / 2, -43, width, 4, 2)
        .fill({ color: 0x101010, alpha: 0.9 });
      ui
        .roundRect(-width / 2 + 1, -42, (width - 2) * ratio, 2, 1)
        .fill({ color: 0x4d8fe8, alpha: 1 });
    }

    const showLabel =
      Boolean(entity.local) ||
      Boolean(entity.targeted) ||
      entity.kind === "player" ||
      entity.kind === "npc";

    visual.label.text = entity.name ?? entity.id;
    visual.label.visible = showLabel;
    visual.label.y = showHp ? -52 : -45;
    visual.label.style.fill = entity.targeted
      ? 0xffe08a
      : entity.local
        ? 0x9fe7ff
        : entity.kind === "npc"
          ? 0xf5deb3
          : 0xffffff;
  }

  private applyHudDeclutter(entities: readonly RenderEntity[]): void {
    const candidates = entities.flatMap((entity) => {
      const visual = this.visuals.get(entity.id);
      if (!visual || !visual.label.visible) return [];

      const x = visual.container.position.x;
      const labelBottom = visual.container.position.y + visual.label.y;
      const width = Math.max(34, visual.label.width);
      const height = Math.max(12, visual.label.height);

      return [
        {
          id: entity.id,
          x: x - width / 2,
          y: labelBottom - height,
          width,
          height,
          priority: entity.targeted
            ? 100
            : entity.local
              ? 90
              : entity.kind === "player"
                ? 70
                : entity.kind === "npc"
                  ? 50
                  : 10,
          always: Boolean(entity.targeted || entity.local)
        }
      ];
    });

    const visible = resolveHudVisibility(candidates, 5);

    for (const entity of entities) {
      const visual = this.visuals.get(entity.id);
      if (!visual) continue;

      const baseLabelVisible =
        Boolean(entity.local) ||
        Boolean(entity.targeted) ||
        entity.kind === "player" ||
        entity.kind === "npc";

      visual.label.visible =
        baseLabelVisible && visible.has(entity.id);

      visual.ui.visible =
        Boolean(entity.local) ||
        entity.kind === "player" ||
        Boolean(entity.targeted);
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

    if (texture && visual.assetId === assetId) {
      visual.sprite.texture = texture;
      visual.sprite.visible = true;
      visual.fallback.visible = false;
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
