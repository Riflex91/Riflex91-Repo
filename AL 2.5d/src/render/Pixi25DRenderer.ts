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
  RenderMapBounds,
  RenderMapSurface
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

function collisionDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;

  return new URLSearchParams(window.location.search).get("collisionDebug") === "1";
}

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
      geometry?.surfaces.length ?? 0,
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

    this.mapLayer.addChild(floor);

    const surfaces = new Graphics();
    for (const surface of geometry?.surfaces ?? []) {
      this.drawMapSurface(surfaces, surface);
    }
    this.mapLayer.addChild(surfaces);

    const grid = new Graphics();
    this.drawGrid(grid, bounds);
    this.mapLayer.addChild(grid);

    if (collisionDebugEnabled()) {
      const walls = new Graphics();
      for (const [x, y1, y2] of geometry?.collisionXLines ?? []) {
        this.drawCollisionWall(walls, { x, y: y1 }, { x, y: y2 });
      }
      for (const [y, x1, x2] of geometry?.collisionYLines ?? []) {
        this.drawCollisionWall(walls, { x: x1, y }, { x: x2, y });
      }
      this.mapLayer.addChild(walls);
    }
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
        .stroke({ color: 0x294038, width: 0.75, alpha: 0.16 });
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

  private drawMapSurface(
    graphics: Graphics,
    surface: RenderMapSurface
  ): void {
    const corners = [
      projectWorldToScreen({ x: surface.minX, y: surface.minY }),
      projectWorldToScreen({ x: surface.maxX, y: surface.minY }),
      projectWorldToScreen({ x: surface.maxX, y: surface.maxY }),
      projectWorldToScreen({ x: surface.minX, y: surface.maxY })
    ];
    const materialColor = this.materialColor(surface.material);
    const structure = surface.layer === "structure";
    const height = structure ? 14 + ((surface.group ?? 0) % 3) * 4 : 0;

    if (height > 0) {
      const frontA = corners[3];
      const frontB = corners[2];
      graphics
        .poly([
          frontA.x,
          frontA.y,
          frontB.x,
          frontB.y,
          frontB.x,
          frontB.y - height,
          frontA.x,
          frontA.y - height
        ])
        .fill({ color: this.shadeColor(materialColor, 0.66), alpha: 0.86 });

      const sideA = corners[1];
      const sideB = corners[2];
      graphics
        .poly([
          sideA.x,
          sideA.y,
          sideB.x,
          sideB.y,
          sideB.x,
          sideB.y - height,
          sideA.x,
          sideA.y - height
        ])
        .fill({ color: this.shadeColor(materialColor, 0.52), alpha: 0.86 });
    }

    const top = corners.flatMap((point) => [point.x, point.y - height]);
    const polygon = graphics
      .poly(top)
      .fill({
        color: materialColor,
        alpha: structure ? 0.92 : 0.82
      });

    if (structure) {
      polygon.stroke({
        color: this.shadeColor(materialColor, 1.14),
        width: 0.9,
        alpha: 0.48
      });
    }

    this.drawSurfaceDetail(graphics, surface, materialColor, height);
  }

  private drawSurfaceDetail(
    graphics: Graphics,
    surface: RenderMapSurface,
    materialColor: number,
    height: number
  ): void {
    const width = Math.max(1, surface.maxX - surface.minX);
    const depth = Math.max(1, surface.maxY - surface.minY);
    const structure = surface.layer === "structure";
    const materialSeed = this.surfaceSeed(
      surface,
      surface.minX + width / 2,
      surface.minY + depth / 2
    );

    if (!structure) {
      const longAxis = Math.max(width, depth);
      const spacing = Math.max(32, Math.min(72, Math.floor(longAxis / 9)));
      const maxSamples = 96;
      let samples = 0;

      for (
        let x = surface.minX + spacing / 2;
        x < surface.maxX && samples < maxSamples;
        x += spacing
      ) {
        for (
          let y = surface.minY + spacing / 2;
          y < surface.maxY && samples < maxSamples;
          y += spacing
        ) {
          const seed = this.surfaceSeed(surface, x, y);
          const jitterX = (this.seedUnit(seed * 7) - 0.5) * spacing * 0.34;
          const jitterY = (this.seedUnit(seed * 11) - 0.5) * spacing * 0.34;
          const point = projectWorldToScreen({
            x: x + jitterX,
            y: y + jitterY
          });
          const fleck = 1.5 + this.seedUnit(seed * 13) * 3.5;
          const brightness = 0.82 + this.seedUnit(seed * 17) * 0.32;

          graphics
            .rect(
              point.x - fleck / 2,
              point.y - fleck / 3,
              fleck,
              Math.max(1, fleck * 0.55)
            )
            .fill({
              color: this.shadeColor(materialColor, brightness),
              alpha: 0.16
            });

          if (this.seedUnit(seed * 19) > 0.7) {
            const a = projectWorldToScreen({
              x: x - spacing * 0.16,
              y
            });
            const b = projectWorldToScreen({
              x: x + spacing * 0.16,
              y
            });
            graphics
              .moveTo(a.x, a.y)
              .lineTo(b.x, b.y)
              .stroke({
                color: this.shadeColor(materialColor, 1.24),
                width: 0.65,
                alpha: 0.12
              });
          }

          samples += 1;
        }
      }

      return;
    }

    const shadowOffset = 9 + this.seedUnit(materialSeed) * 6;
    const frontLeft = projectWorldToScreen({
      x: surface.minX,
      y: surface.maxY
    });
    const frontRight = projectWorldToScreen({
      x: surface.maxX,
      y: surface.maxY
    });

    graphics
      .poly([
        frontLeft.x,
        frontLeft.y,
        frontRight.x,
        frontRight.y,
        frontRight.x + shadowOffset,
        frontRight.y + shadowOffset * 0.45,
        frontLeft.x + shadowOffset,
        frontLeft.y + shadowOffset * 0.45
      ])
      .fill({ color: 0x000000, alpha: 0.12 });

    const ridgeCount = Math.max(
      1,
      Math.min(4, Math.floor((width + depth) / 160))
    );

    for (let ridge = 1; ridge <= ridgeCount; ridge += 1) {
      const t = ridge / (ridgeCount + 1);
      const start = projectWorldToScreen({
        x: surface.minX + width * t,
        y: surface.minY
      });
      const end = projectWorldToScreen({
        x: surface.minX + width * t,
        y: surface.maxY
      });

      graphics
        .moveTo(start.x, start.y - height)
        .lineTo(end.x, end.y - height)
        .stroke({
          color: this.shadeColor(materialColor, 0.72),
          width: 1,
          alpha: 0.22
        });
    }
  }

  private surfaceSeed(
    surface: RenderMapSurface,
    worldX: number,
    worldY: number
  ): number {
    const key = [
      surface.material,
      surface.tile,
      surface.layer,
      Math.round(surface.minX),
      Math.round(surface.minY),
      Math.round(worldX),
      Math.round(worldY)
    ].join(":");

    let hash = 2166136261;
    for (let index = 0; index < key.length; index += 1) {
      hash ^= key.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
  }

  private seedUnit(seed: number): number {
    const next = Math.imul(seed ^ 0x9e3779b9, 1664525) + 1013904223;
    return ((next >>> 0) % 1000) / 1000;
  }

  private materialColor(material: string): number {
    const palette = [
      0x274239,
      0x304a3f,
      0x3a4d42,
      0x465344,
      0x3b4c4e,
      0x4a463b,
      0x2f4848,
      0x4b503f
    ];

    let hash = 2166136261;
    for (let index = 0; index < material.length; index += 1) {
      hash ^= material.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }

    return palette[(hash >>> 0) % palette.length];
  }

  private shadeColor(color: number, factor: number): number {
    const red = Math.max(0, Math.min(255, Math.round(((color >> 16) & 255) * factor)));
    const green = Math.max(0, Math.min(255, Math.round(((color >> 8) & 255) * factor)));
    const blue = Math.max(0, Math.min(255, Math.round((color & 255) * factor)));

    return (red << 16) | (green << 8) | blue;
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
