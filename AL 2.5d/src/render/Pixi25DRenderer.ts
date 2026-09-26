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
import { resolveCustomEntityArt } from "./CustomEntityArt";
import type {
  CameraState,
  EntityKind,
  GameFrameSnapshot,
  RenderBridge,
  RenderEntity,
  RenderMapBounds,
  RenderMapSurface,
  RenderSpriteFrame,
  RenderLootChest
} from "./RenderBridge";
import { resolveHudVisibility } from "./hudLayout";
import { projectWorldToScreen } from "./projection";

export type EntityAnimationAction =
  | "attack"
  | "cast"
  | "hit"
  | "death"
  | "respawn";

type EntityAnimationCue = Readonly<{
  kind: EntityAnimationAction;
  startedAt: number;
  until: number;
}>;

type EntityVisual = {
  container: Container;
  art: Container;
  sprite: Sprite;
  shadow: Graphics;
  fallback: Graphics;
  ui: Graphics;
  label: Text;
  assetId: string;
  spriteKey: string;
  shadowKey: string;
  kind: EntityKind;
  uiKey: string;
  lastX: number;
  lastY: number;
  lastHp?: number;
  movingUntil: number;
  action?: EntityAnimationCue;
  animationPhase: number;
  facing: number;
};

type LootChestVisual = {
  container: Container;
  body: Graphics;
  label: Text;
  key: string;
};

const DEFAULT_CAMERA: CameraState = {
  x: 0,
  y: 0,
  zoom: 1.5,
  rotation: 0
};

export function detectEntityMotion(
  previous: Readonly<{ x: number; y: number }> | undefined,
  current: Readonly<{ x: number; y: number }>
): boolean {
  if (!previous) return false;

  return Math.hypot(
    current.x - previous.x,
    current.y - previous.y
  ) > 0.25;
}

export function hpAnimationTransition(
  previousHp: number | undefined,
  nextHp: number | undefined
): EntityAnimationAction | null {
  if (
    previousHp === undefined ||
    nextHp === undefined ||
    previousHp === nextHp
  ) {
    return null;
  }

  if (previousHp > 0 && nextHp <= 0) return "death";
  if (previousHp <= 0 && nextHp > 0) return "respawn";
  if (nextHp < previousHp) return "hit";
  return null;
}

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
  private readonly structureVisuals: Array<
    Readonly<{ container: Container; surface: RenderMapSurface }>
  > = [];
  private readonly visuals = new Map<string, EntityVisual>();
  private readonly lootChestVisuals = new Map<string, LootChestVisual>();
  private readonly textureLoads = new Map<string, Promise<Texture | null>>();
  private readonly imageLoads = new Map<
    string,
    Promise<HTMLImageElement | null>
  >();
  private readonly groundTextureCache = new Map<
    string,
    Readonly<{ texture: Texture; rasterScale: number }>
  >();
  private readonly legacySpriteTextureCache = new Map<string, Texture>();
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
    this.app.ticker.add(this.animateEntities);
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
    this.renderLootChests(snapshot.lootChests ?? []);

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
    for (const visual of this.lootChestVisuals.values()) {
      visual.container.destroy({ children: true });
    }
    this.lootChestVisuals.clear();
    this.clearStructureVisuals();
    this.textureLoads.clear();
    this.imageLoads.clear();
    for (const cached of this.groundTextureCache.values()) {
      cached.texture.destroy(true);
    }
    this.groundTextureCache.clear();
    for (const texture of this.legacySpriteTextureCache.values()) {
      texture.destroy(true);
    }
    this.legacySpriteTextureCache.clear();
    this.app.ticker.remove(this.animateEntities);
    this.app.destroy(true, { children: true });
    this.mounted = false;
    this.mapVisualKey = "";
  }

  playEntityAction(
    entityId: string,
    kind: "attack" | "cast"
  ): void {
    const visual = this.visuals.get(entityId);
    if (!visual) return;

    const now = performance.now();
    this.cueEntityAction(visual, kind, now);
  }

  private cueEntityAction(
    visual: EntityVisual,
    kind: EntityAnimationAction,
    now: number
  ): void {
    const duration =
      kind === "death"
        ? 820
        : kind === "respawn"
          ? 620
          : kind === "hit"
            ? 260
            : kind === "cast"
              ? 460
              : 320;

    visual.action = Object.freeze({
      kind,
      startedAt: now,
      until: now + duration
    });
  }

  private readonly animateEntities = (): void => {
    if (!this.mounted) return;

    const now = performance.now();

    for (const visual of this.visuals.values()) {
      let offsetX = 0;
      let offsetY = 0;
      let scaleX = 1;
      let scaleY = 1;
      let rotation = 0;
      let alpha = 1;

      const action =
        visual.action && visual.action.until > now
          ? visual.action
          : undefined;

      if (visual.action && !action) {
        visual.action = undefined;
      }

      if (action) {
        const duration = Math.max(1, action.until - action.startedAt);
        const t = Math.max(
          0,
          Math.min(1, (now - action.startedAt) / duration)
        );
        const pulse = Math.sin(Math.PI * t);

        if (action.kind === "attack") {
          offsetX = visual.facing * pulse * 7;
          offsetY = -pulse * 2;
          rotation = visual.facing * pulse * 0.08;
          scaleX = 1 + pulse * 0.1;
          scaleY = 1 - pulse * 0.04;
        } else if (action.kind === "cast") {
          offsetY = -pulse * 4;
          scaleX = 1 + pulse * 0.08;
          scaleY = 1 + pulse * 0.08;
        } else if (action.kind === "hit") {
          offsetX = Math.sin(t * Math.PI * 5) * (1 - t) * 5;
          rotation = Math.sin(t * Math.PI * 4) * (1 - t) * 0.055;
        } else if (action.kind === "death") {
          offsetY = t * 5;
          rotation = visual.facing * t * 0.34;
          scaleY = 1 - t * 0.18;
          alpha = 1 - t * 0.48;
        } else if (action.kind === "respawn") {
          offsetY = -(1 - t) * 10;
          scaleX = 0.78 + t * 0.22;
          scaleY = 0.78 + t * 0.22;
          alpha = 0.35 + t * 0.65;
        }
      } else if (visual.movingUntil > now) {
        const phase = now / 105 + visual.animationPhase;
        const stride = Math.abs(Math.sin(phase));
        offsetY = -stride * 2.6;
        rotation = Math.sin(phase) * 0.025;
        scaleX = 1 + stride * 0.035;
        scaleY = 1 - stride * 0.028;
      } else if (visual.kind === "projectile") {
        const phase = now / 160 + visual.animationPhase;
        offsetY = Math.sin(phase) * 1.3;
        scaleX = 1 + Math.sin(phase) * 0.035;
        scaleY = scaleX;
      } else {
        const phase = now / 560 + visual.animationPhase;
        const breath = (Math.sin(phase) + 1) * 0.5;
        offsetY = -breath * 1.15;
        scaleX = 1 + breath * 0.012;
        scaleY = 1 - breath * 0.01;
      }

      visual.art.position.set(offsetX, offsetY);
      visual.art.scale.set(scaleX, scaleY);
      visual.art.rotation = rotation;
      visual.art.alpha = alpha;
    }
  };

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
    this.clearStructureVisuals();

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

    const groundSurfaces = new Graphics();
    const groundTextureLayer = new Container();

    for (const surface of geometry?.surfaces ?? []) {
      if (surface.layer === "ground") {
        this.drawMapSurface(groundSurfaces, surface);
        void this.addTexturedMapSurface(
          surface,
          groundTextureLayer,
          key,
          0
        );
        continue;
      }

      const height = this.surfaceHeight(surface);
      const structureVisual = new Container();
      const structureGeometry = new Graphics();

      this.drawMapSurface(structureGeometry, surface);
      structureVisual.addChild(structureGeometry);
      structureVisual.zIndex = this.structureDepth(surface);
      this.world.addChild(structureVisual);
      this.structureVisuals.push(
        Object.freeze({ container: structureVisual, surface })
      );

      void this.addTexturedMapSurface(
        surface,
        structureVisual,
        key,
        height
      );
    }

    this.mapLayer.addChild(groundSurfaces);
    this.mapLayer.addChild(groundTextureLayer);

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
    const height = this.surfaceHeight(surface);

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
    const materialKind = this.materialKind(surface.material);
    const materialSeed = this.surfaceSeed(
      surface,
      surface.minX + width / 2,
      surface.minY + depth / 2
    );

    if (!structure) {
      if (materialKind === "stone") {
        const spacing = Math.max(24, Math.min(48, Math.floor(Math.max(width, depth) / 10)));
        const maxLines = 120;
        let lines = 0;

        for (
          let x = surface.minX + spacing;
          x < surface.maxX && lines < maxLines;
          x += spacing
        ) {
          const a = projectWorldToScreen({ x, y: surface.minY });
          const b = projectWorldToScreen({ x, y: surface.maxY });
          graphics
            .moveTo(a.x, a.y)
            .lineTo(b.x, b.y)
            .stroke({
              color: this.shadeColor(materialColor, 0.72),
              width: 0.8,
              alpha: 0.2
            });
          lines += 1;
        }

        for (
          let y = surface.minY + spacing;
          y < surface.maxY && lines < maxLines;
          y += spacing
        ) {
          const stagger = Math.round(y / spacing) % 2 === 0 ? spacing * 0.35 : 0;
          const a = projectWorldToScreen({
            x: Math.min(surface.maxX, surface.minX + stagger),
            y
          });
          const b = projectWorldToScreen({ x: surface.maxX, y });
          graphics
            .moveTo(a.x, a.y)
            .lineTo(b.x, b.y)
            .stroke({
              color: this.shadeColor(materialColor, 1.22),
              width: 0.55,
              alpha: 0.13
            });
          lines += 1;
        }

        return;
      }

      if (materialKind === "water") {
        const spacing = Math.max(28, Math.min(54, Math.floor(Math.max(width, depth) / 9)));
        let waves = 0;
        for (
          let y = surface.minY + spacing / 2;
          y < surface.maxY && waves < 48;
          y += spacing
        ) {
          const seed = this.surfaceSeed(surface, surface.minX, y);
          const x1 = surface.minX + spacing * this.seedUnit(seed * 3);
          const x2 = Math.min(surface.maxX, x1 + spacing * 1.7);
          const a = projectWorldToScreen({ x: x1, y });
          const b = projectWorldToScreen({ x: x2, y });
          graphics
            .moveTo(a.x, a.y)
            .lineTo(b.x, b.y)
            .stroke({
              color: this.shadeColor(materialColor, 1.45),
              width: 1.1,
              alpha: 0.28
            });
          waves += 1;
        }
        return;
      }

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

          if (materialKind === "grass") {
            graphics
              .moveTo(point.x - fleck, point.y + 1)
              .lineTo(point.x, point.y - fleck * 1.5)
              .lineTo(point.x + fleck, point.y + 1)
              .stroke({
                color: this.shadeColor(materialColor, brightness * 1.16),
                width: 0.8,
                alpha: 0.25
              });
          } else {
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
          }

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

    if (materialKind === "architecture" && height >= 8) {
      const windowCount = Math.max(1, Math.min(5, Math.floor(width / 72)));

      for (let index = 1; index <= windowCount; index += 1) {
        const t = index / (windowCount + 1);
        const x = frontLeft.x + (frontRight.x - frontLeft.x) * t;
        const y = frontLeft.y + (frontRight.y - frontLeft.y) * t - height * 0.53;
        const seed = this.surfaceSeed(
          surface,
          surface.minX + width * t,
          surface.maxY
        );

        if (this.seedUnit(seed * 23) < 0.22) continue;

        graphics
          .roundRect(x - 2.8, y - 3.4, 5.6, 6.8, 1.2)
          .fill({ color: 0xffcf74, alpha: 0.42 })
          .stroke({ color: 0xffedb0, width: 0.55, alpha: 0.3 });
      }
    }

    if (materialKind === "wood") {
      const beamY = frontLeft.y - Math.max(2, height * 0.42);
      graphics
        .moveTo(frontLeft.x, beamY)
        .lineTo(frontRight.x, beamY + (frontRight.y - frontLeft.y))
        .stroke({
          color: this.shadeColor(materialColor, 0.58),
          width: 1.35,
          alpha: 0.36
        });
    }
  }

  private materialKind(
    material: string
  ): "stone" | "grass" | "water" | "wood" | "architecture" | "generic" {
    const key = material.toLowerCase();

    if (/(water|river|lake|pond|sea)/.test(key)) return "water";
    if (/(grass|tree|bush|flower|plant|forest|green)/.test(key)) return "grass";
    if (/(wood|fence|crate|barrel|bridge)/.test(key)) return "wood";
    if (/(wall|house|roof|building|castle|fort|tower|shop|interior)/.test(key)) {
      return "architecture";
    }
    if (/(town|road|path|floor|stone|brick|pave)/.test(key)) return "stone";

    return "generic";
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

  private surfaceHeight(surface: RenderMapSurface): number {
    if (surface.layer !== "structure") return 0;

    return Math.max(
      0,
      Math.min(
        28,
        surface.elevation ?? 10
      )
    );
  }

  private cameraDepth(point: Readonly<{ x: number; y: number }>): number {
    const rotation = this.camera.rotation ?? 0;
    return point.x * Math.sin(rotation) + point.y * Math.cos(rotation);
  }

  private structureDepth(surface: RenderMapSurface): number {
    return this.cameraDepth(
      projectWorldToScreen({
        x: surface.maxX,
        y: surface.maxY
      })
    );
  }

  private refreshDepthOrder(): void {
    for (const visual of this.visuals.values()) {
      visual.container.zIndex = this.cameraDepth({
        x: visual.container.position.x,
        y: visual.container.position.y
      });
      visual.container.rotation = -(this.camera.rotation ?? 0);
    }

    for (const visual of this.lootChestVisuals.values()) {
      visual.container.zIndex = this.cameraDepth({
        x: visual.container.position.x,
        y: visual.container.position.y
      }) + 0.05;
      visual.container.rotation = -(this.camera.rotation ?? 0);
    }

    for (const entry of this.structureVisuals) {
      entry.container.zIndex = this.structureDepth(entry.surface);
    }
  }

  private clearStructureVisuals(): void {
    for (const visual of this.structureVisuals.splice(0)) {
      visual.container.removeFromParent();
      visual.container.destroy({ children: true });
    }
  }

  private async addTexturedMapSurface(
    surface: RenderMapSurface,
    layer: Container,
    mapKey: string,
    elevation: number
  ): Promise<void> {
    if (
      !surface.textureUrl ||
      surface.sourceX === undefined ||
      surface.sourceY === undefined ||
      surface.tileWidth === undefined ||
      surface.tileHeight === undefined
    ) {
      return;
    }

    const image = await this.loadMapImage(surface.textureUrl);
    if (!image || this.mapVisualKey !== mapKey || !layer.parent) {
      return;
    }

    const cached = this.createProjectedSurfaceTexture(surface, image);
    if (!cached) return;

    const sprite = new Sprite(cached.texture);
    const origin = projectWorldToScreen({
      x: surface.minX,
      y: surface.minY
    });
    const worldDepth = surface.maxY - surface.minY;
    const inverseRasterScale = 1 / cached.rasterScale;

    sprite.position.set(
      origin.x - worldDepth * 0.5,
      origin.y - elevation
    );
    sprite.scale.set(inverseRasterScale);
    sprite.alpha = surface.layer === "structure" ? 0.98 : 0.9;
    layer.addChild(sprite);
  }

  private loadMapImage(src: string): Promise<HTMLImageElement | null> {
    const resolved = new URL(src, window.location.href).href;
    const existing = this.imageLoads.get(resolved);
    if (existing) return existing;

    const load = new Promise<HTMLImageElement | null>((resolve) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = resolved;
    });

    this.imageLoads.set(resolved, load);
    return load;
  }

  private createProjectedSurfaceTexture(
    surface: RenderMapSurface,
    image: HTMLImageElement
  ): Readonly<{ texture: Texture; rasterScale: number }> | null {
    const tileWidth = surface.tileWidth;
    const tileHeight = surface.tileHeight;
    const sourceX = surface.sourceX;
    const sourceY = surface.sourceY;

    if (
      tileWidth === undefined ||
      tileHeight === undefined ||
      sourceX === undefined ||
      sourceY === undefined ||
      tileWidth <= 0 ||
      tileHeight <= 0
    ) {
      return null;
    }

    const worldWidth = Math.max(1, surface.maxX - surface.minX);
    const worldDepth = Math.max(1, surface.maxY - surface.minY);
    const cacheKey = [
      surface.textureUrl,
      sourceX,
      sourceY,
      tileWidth,
      tileHeight,
      worldWidth,
      worldDepth
    ].join(":");
    const existing = this.groundTextureCache.get(cacheKey);
    if (existing) return existing;

    const maxRasterSide = 1024;
    const rasterScale = Math.min(
      1,
      maxRasterSide / worldWidth,
      maxRasterSide / worldDepth
    );
    const flat = document.createElement("canvas");
    flat.width = Math.max(1, Math.ceil(worldWidth * rasterScale));
    flat.height = Math.max(1, Math.ceil(worldDepth * rasterScale));

    const flatContext = flat.getContext("2d");
    if (!flatContext) return null;

    flatContext.imageSmoothingEnabled = false;

    for (let x = 0; x < worldWidth; x += tileWidth) {
      for (let y = 0; y < worldDepth; y += tileHeight) {
        const remainingWidth = Math.min(tileWidth, worldWidth - x);
        const remainingHeight = Math.min(tileHeight, worldDepth - y);
        const sourceWidth = Math.max(1, remainingWidth);
        const sourceHeight = Math.max(1, remainingHeight);

        flatContext.drawImage(
          image,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          x * rasterScale,
          y * rasterScale,
          remainingWidth * rasterScale,
          remainingHeight * rasterScale
        );
      }
    }

    const isoWidth = Math.max(
      1,
      Math.ceil((flat.width + flat.height) * 0.5)
    );
    const isoHeight = Math.max(
      1,
      Math.ceil((flat.width + flat.height) * 0.25)
    );
    const iso = document.createElement("canvas");
    iso.width = isoWidth;
    iso.height = isoHeight;

    const isoContext = iso.getContext("2d");
    if (!isoContext) return null;

    isoContext.imageSmoothingEnabled = false;
    isoContext.setTransform(
      0.5,
      0.25,
      -0.5,
      0.25,
      flat.height * 0.5,
      0
    );
    isoContext.drawImage(flat, 0, 0);

    const texture = Texture.from(iso);
    const cached = Object.freeze({ texture, rasterScale });
    this.groundTextureCache.set(cacheKey, cached);
    return cached;
  }

  private materialColor(material: string): number {
    const kind = this.materialKind(material);

    if (kind === "water") return 0x2d6576;
    if (kind === "grass") return 0x31583f;
    if (kind === "stone") return 0x5a584c;
    if (kind === "architecture") return 0x665044;
    if (kind === "wood") return 0x5b4230;

    const palette = [
      0x32483f,
      0x3b4f43,
      0x485548,
      0x4e5350
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

  private renderLootChests(chests: readonly RenderLootChest[]): void {
    const alive = new Set<string>();

    for (const chest of chests) {
      alive.add(chest.id);
      let visual = this.lootChestVisuals.get(chest.id);

      if (!visual) {
        const container = new Container();
        const body = new Graphics();
        const label = new Text({
          text: "",
          style: {
            fontFamily: "Arial, sans-serif",
            fontSize: 8,
            fontWeight: "700",
            fill: 0xf5d889,
            stroke: { color: 0x16130c, width: 3 },
            align: "center"
          }
        });

        label.anchor.set(0.5, 1);
        container.addChild(body);
        container.addChild(label);
        this.world.addChild(container);

        visual = { container, body, label, key: "" };
        this.lootChestVisuals.set(chest.id, visual);
      }

      const key = [
        chest.items ?? "",
        chest.opening ? 1 : 0
      ].join("|");

      if (visual.key !== key) {
        visual.key = key;
        this.drawLootChest(visual, chest);
      }

      const projected = projectWorldToScreen(chest);
      visual.container.position.set(projected.x, projected.y);
      visual.container.zIndex = this.cameraDepth(projected) + 0.05;
      visual.container.rotation = -(this.camera.rotation ?? 0);
    }

    for (const [id, visual] of this.lootChestVisuals) {
      if (alive.has(id)) continue;
      visual.container.destroy({ children: true });
      this.lootChestVisuals.delete(id);
    }
  }

  private drawLootChest(
    visual: LootChestVisual,
    chest: RenderLootChest
  ): void {
    const body = visual.body;
    body.clear();

    body
      .ellipse(0, 2, 15, 5)
      .fill({ color: 0x000000, alpha: 0.28 });

    body
      .roundRect(-14, -15, 28, 14, 3)
      .fill({ color: 0x6b482a, alpha: 1 })
      .stroke({ color: 0xd2a85b, width: 1.4, alpha: 0.9 });

    body
      .rect(-3, -11, 6, 8)
      .fill({ color: 0xc89e4e, alpha: 1 })
      .stroke({ color: 0xf2d98d, width: 0.8, alpha: 0.9 });

    if (chest.opening) {
      body
        .poly([-14, -18, 14, -18, 10, -29, -10, -29])
        .fill({ color: 0x7c5733, alpha: 1 })
        .stroke({ color: 0xe0bd72, width: 1.4, alpha: 0.95 });
      body
        .ellipse(0, -17, 17, 7)
        .fill({ color: 0xffd86d, alpha: 0.12 })
        .stroke({ color: 0xffdf83, width: 1.2, alpha: 0.34 });
    } else {
      body
        .roundRect(-15, -22, 30, 9, 4)
        .fill({ color: 0x79522e, alpha: 1 })
        .stroke({ color: 0xddb765, width: 1.4, alpha: 0.95 });
    }

    visual.label.text =
      chest.items !== undefined && chest.items > 0
        ? `${chest.items} LOOT`
        : "LOOT";
    visual.label.y = chest.opening ? -32 : -25;
  }

  private upsertEntity(entity: RenderEntity): void {
    let visual = this.visuals.get(entity.id);

    if (!visual) {
      const container = new Container();
      const art = new Container();
      const sprite = new Sprite(Texture.WHITE);
      const shadow = new Graphics();
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

      container.addChild(shadow);
      art.addChild(fallback);
      art.addChild(sprite);
      container.addChild(art);
      container.addChild(ui);
      container.addChild(label);
      this.world.addChild(container);

      visual = {
        container,
        art,
        sprite,
        shadow,
        fallback,
        ui,
        label,
        assetId: "",
        spriteKey: "",
        shadowKey: "",
        kind: entity.kind,
        uiKey: "",
        lastX: entity.x,
        lastY: entity.y,
        ...(entity.hp === undefined ? {} : { lastHp: entity.hp }),
        movingUntil: 0,
        animationPhase:
          Array.from(entity.id).reduce(
            (sum, char) => sum + char.charCodeAt(0),
            0
          ) % 17,
        facing: 1
      };

      this.drawFallback(fallback, entity.kind, Boolean(entity.local));
      this.visuals.set(entity.id, visual);
    } else if (visual.kind !== entity.kind) {
      visual.kind = entity.kind;
      this.drawFallback(visual.fallback, entity.kind, Boolean(entity.local));
    }

    const customArt = resolveCustomEntityArt(entity);

    if (customArt) {
      if (visual.spriteKey) {
        visual.spriteKey = "";
      }

      if (visual.assetId !== customArt.assetId) {
        visual.assetId = customArt.assetId;
        visual.sprite.visible = false;
        visual.fallback.visible = true;
        void this.loadTexture(visual, customArt.assetId);
      }
    } else if (entity.legacySprite) {
      const spriteKey = this.legacySpriteKey(entity.legacySprite);

      if (visual.spriteKey !== spriteKey) {
        visual.spriteKey = spriteKey;
        visual.assetId = "";
        visual.sprite.visible = false;
        visual.fallback.visible = true;
        void this.loadLegacySprite(
          visual,
          entity.legacySprite,
          spriteKey
        );
      }
    } else {
      if (visual.spriteKey) {
        visual.spriteKey = "";
        visual.assetId = "";
        visual.sprite.visible = false;
        visual.fallback.visible = true;
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
    }

    const now = performance.now();
    if (
      detectEntityMotion(
        { x: visual.lastX, y: visual.lastY },
        entity
      )
    ) {
      visual.movingUntil = now + 190;
    }

    const hpCue = hpAnimationTransition(visual.lastHp, entity.hp);
    if (hpCue) {
      this.cueEntityAction(visual, hpCue, now);
    }

    visual.lastX = entity.x;
    visual.lastY = entity.y;
    if (entity.hp === undefined) {
      delete visual.lastHp;
    } else {
      visual.lastHp = entity.hp;
    }

    const metrics = this.entityVisualMetrics(entity);
    const shadowKey = [
      entity.kind,
      entity.local ? 1 : 0,
      metrics.width,
      metrics.height
    ].join("|");

    if (visual.shadowKey !== shadowKey) {
      visual.shadowKey = shadowKey;
      this.drawEntityShadow(visual.shadow, entity);
    }

    const projected = projectWorldToScreen(entity);
    visual.container.position.set(projected.x, projected.y);
    visual.container.zIndex = this.cameraDepth(projected);
    visual.container.rotation = -(this.camera.rotation ?? 0);

    visual.container.scale.set(entity.scale ?? 1);
    visual.container.alpha = entity.alpha ?? 1;

    const facing = entity.facing !== undefined && entity.facing < 0 ? -1 : 1;
    visual.facing = facing;
    visual.sprite.scale.x = facing;
    visual.fallback.scale.x = facing;

    const uiKey = [
      entity.name ?? entity.id,
      entity.hp ?? "",
      entity.maxHp ?? "",
      entity.mp ?? "",
      entity.maxMp ?? "",
      entity.targeted ? 1 : 0,
      entity.local ? 1 : 0,
      metrics.width,
      metrics.height
    ].join("|");

    if (visual.uiKey !== uiKey) {
      visual.uiKey = uiKey;
      this.drawEntityUi(visual, entity);
    }
  }

  private entityVisualMetrics(
    entity: RenderEntity
  ): Readonly<{ width: number; height: number }> {
    const customArt = resolveCustomEntityArt(entity);

    if (customArt) {
      return {
        width: customArt.width,
        height: customArt.height
      };
    }

    return {
      width: entity.legacySprite?.width ?? 36,
      height:
        entity.legacySprite?.height ??
        (entity.kind === "monster" ? 30 : 42)
    };
  }

  private drawEntityShadow(
    graphics: Graphics,
    entity: RenderEntity
  ): void {
    graphics.clear();

    const spriteWidth = this.entityVisualMetrics(entity).width;
    const radiusX = spriteWidth !== undefined
      ? Math.max(7, Math.min(20, spriteWidth * 0.34))
      : entity.kind === "monster"
        ? 12
        : 9;
    const radiusY = Math.max(3, Math.min(7, radiusX * 0.34));

    graphics
      .ellipse(0, 2, radiusX, radiusY)
      .fill({
        color: 0x000000,
        alpha: entity.local ? 0.28 : 0.22
      });

    if (entity.local) {
      graphics
        .ellipse(0, 2, radiusX + 2, radiusY + 1)
        .stroke({
          color: 0x7fdcff,
          width: 1,
          alpha: 0.28
        });
    }
  }

  private drawFallback(
    graphics: Graphics,
    kind: EntityKind,
    local: boolean
  ): void {
    graphics.clear();

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

    if (kind === "projectile") {
      graphics
        .circle(0, -10, 5.5)
        .fill({ color: 0x9de8ff, alpha: 0.96 })
        .stroke({ color: 0xf1fdff, width: 1.2, alpha: 0.95 });
      graphics
        .circle(0, -10, 10)
        .stroke({ color: 0x6dcfff, width: 1.4, alpha: 0.32 });
      graphics
        .moveTo(-15, -10)
        .lineTo(-6, -10)
        .stroke({ color: 0x79dbff, width: 2.2, alpha: 0.44 });
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

    const metrics = this.entityVisualMetrics(entity);
    const spriteHeight = Math.max(
      28,
      Math.min(76, metrics.height)
    );
    const spriteWidth = Math.max(
      28,
      Math.min(56, metrics.width)
    );
    const hpBarY = -spriteHeight - 12;
    const mpBarY = -spriteHeight - 6;
    const statusWidth = Math.max(34, Math.min(50, spriteWidth * 1.1));

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
      const width = statusWidth;
      const ratio = Math.max(0, Math.min(1, entity.hp / maxHp));
      ui
        .roundRect(-width / 2, hpBarY, width, 5, 2)
        .fill({ color: 0x101010, alpha: 0.9 });
      ui
        .roundRect(-width / 2 + 1, hpBarY + 1, (width - 2) * ratio, 3, 1)
        .fill({ color: 0x55c56b, alpha: 1 });
    }

    const showMp =
      entity.maxMp !== undefined &&
      entity.maxMp > 0 &&
      entity.mp !== undefined &&
      (entity.local || entity.kind === "player");

    if (showMp && entity.maxMp !== undefined && entity.mp !== undefined) {
      const width = statusWidth;
      const ratio = Math.max(0, Math.min(1, entity.mp / entity.maxMp));
      ui
        .roundRect(-width / 2, mpBarY, width, 4, 2)
        .fill({ color: 0x101010, alpha: 0.9 });
      ui
        .roundRect(-width / 2 + 1, mpBarY + 1, (width - 2) * ratio, 2, 1)
        .fill({ color: 0x4d8fe8, alpha: 1 });
    }

    const showLabel =
      Boolean(entity.local) ||
      Boolean(entity.targeted) ||
      entity.kind === "player" ||
      entity.kind === "npc";

    visual.label.text = entity.name ?? entity.id;
    visual.label.visible = showLabel;
    visual.label.y = showHp
      ? hpBarY - 3
      : -spriteHeight - 5;
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

  private legacySpriteKey(frame: RenderSpriteFrame): string {
    return [
      frame.src,
      frame.sourceX,
      frame.sourceY,
      frame.width,
      frame.height
    ].join(":");
  }

  private async loadLegacySprite(
    visual: EntityVisual,
    frame: RenderSpriteFrame,
    spriteKey: string
  ): Promise<void> {
    const image = await this.loadMapImage(frame.src);

    if (!image || visual.spriteKey !== spriteKey) {
      return;
    }

    let texture = this.legacySpriteTextureCache.get(spriteKey);

    if (!texture) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.ceil(frame.width));
      canvas.height = Math.max(1, Math.ceil(frame.height));
      const context = canvas.getContext("2d");

      if (!context) return;

      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(
        image,
        frame.sourceX,
        frame.sourceY,
        frame.width,
        frame.height,
        0,
        0,
        canvas.width,
        canvas.height
      );

      texture = Texture.from(canvas);
      this.legacySpriteTextureCache.set(spriteKey, texture);
    }

    if (visual.spriteKey !== spriteKey) {
      return;
    }

    visual.sprite.texture = texture;
    visual.sprite.visible = true;
    visual.fallback.visible = false;
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

    this.world.pivot.set(this.camera.x, this.camera.y);
    this.world.position.set(
      this.app.screen.width / 2,
      this.app.screen.height / 2
    );
    this.world.scale.set(this.camera.zoom);
    this.world.rotation = this.camera.rotation ?? 0;
    this.refreshDepthOrder();
  }
}
