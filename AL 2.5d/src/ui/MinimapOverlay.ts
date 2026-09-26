import type { GraphicsMode } from "../legacy/LegacyCompatibilityRuntime";
import type {
  GameFrameSnapshot,
  RenderEntity,
  RenderMapBounds
} from "../render/RenderBridge";

export type NormalizedMinimapPoint = Readonly<{
  x: number;
  y: number;
}>;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function normalizeMinimapPoint(
  bounds: RenderMapBounds,
  x: number,
  y: number
): NormalizedMinimapPoint {
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);

  return Object.freeze({
    x: clamp01((x - bounds.minX) / width),
    y: clamp01((y - bounds.minY) / height)
  });
}

export function resolveMinimapBounds(
  snapshot: GameFrameSnapshot
): RenderMapBounds {
  const explicit = snapshot.mapState?.geometry.bounds;
  if (
    explicit &&
    explicit.maxX > explicit.minX &&
    explicit.maxY > explicit.minY
  ) {
    return explicit;
  }

  const local = snapshot.entities.find((entity) => entity.local);
  const centerX = local?.x ?? 0;
  const centerY = local?.y ?? 0;

  if (!snapshot.entities.length) {
    return Object.freeze({
      minX: centerX - 450,
      minY: centerY - 450,
      maxX: centerX + 450,
      maxY: centerY + 450
    });
  }

  const xs = snapshot.entities.map((entity) => entity.x);
  const ys = snapshot.entities.map((entity) => entity.y);
  const minX = Math.min(centerX - 450, ...xs) - 80;
  const minY = Math.min(centerY - 450, ...ys) - 80;
  const maxX = Math.max(centerX + 450, ...xs) + 80;
  const maxY = Math.max(centerY + 450, ...ys) + 80;

  return Object.freeze({ minX, minY, maxX, maxY });
}

function markerStyle(entity: RenderEntity): Readonly<{
  fill: string;
  radius: number;
}> {
  if (entity.local) return Object.freeze({ fill: "#f6df8d", radius: 4.2 });
  if (entity.targeted) return Object.freeze({ fill: "#ff755d", radius: 4 });
  if (entity.kind === "monster") return Object.freeze({ fill: "#d85a54", radius: 2.8 });
  if (entity.kind === "npc") return Object.freeze({ fill: "#d9b969", radius: 2.7 });
  if (entity.kind === "player") return Object.freeze({ fill: "#83d4e7", radius: 2.9 });
  if (entity.kind === "projectile") return Object.freeze({ fill: "#8ce6ff", radius: 1.8 });
  return Object.freeze({ fill: "#8aa09d", radius: 2 });
}

export class MinimapOverlay {
  private readonly root = document.createElement("aside");
  private readonly title = document.createElement("strong");
  private readonly meta = document.createElement("span");
  private readonly canvas = document.createElement("canvas");
  private readonly context: CanvasRenderingContext2D | null;
  private lastKey = "";
  private mode: GraphicsMode = "original";
  private enabled = true;

  constructor(owner: HTMLElement = document.body) {
    this.root.id = "al25d-minimap";
    this.root.hidden = true;

    const header = document.createElement("header");
    this.title.textContent = "MAIN";
    this.meta.textContent = "RADAR";
    header.append(this.title, this.meta);

    this.canvas.width = 196;
    this.canvas.height = 142;
    this.canvas.setAttribute("aria-label", "2.5D minimap");

    const legend = document.createElement("footer");
    for (const [kind, label] of [
      ["local", "YOU"],
      ["target", "TARGET"],
      ["monster", "HOSTILE"],
      ["npc", "NPC"]
    ] as const) {
      const entry = document.createElement("span");
      entry.dataset.kind = kind;
      entry.textContent = label;
      legend.appendChild(entry);
    }

    this.root.append(header, this.canvas, legend);
    owner.appendChild(this.root);
    this.context = this.canvas.getContext("2d");
  }

  setMode(mode: GraphicsMode): void {
    this.mode = mode;
    this.syncVisibility();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.syncVisibility();
  }

  render(snapshot: GameFrameSnapshot): void {
    const bounds = resolveMinimapBounds(snapshot);
    const key = [
      snapshot.map,
      bounds.minX,
      bounds.minY,
      bounds.maxX,
      bounds.maxY,
      ...snapshot.entities.map((entity) =>
        [
          entity.id,
          Math.round(entity.x),
          Math.round(entity.y),
          entity.kind,
          entity.local ? 1 : 0,
          entity.targeted ? 1 : 0
        ].join(":")
      )
    ].join("|");

    if (key === this.lastKey) return;
    this.lastKey = key;

    const monsters = snapshot.entities.filter((entity) => entity.kind === "monster").length;
    const players = snapshot.entities.filter((entity) => entity.kind === "player").length;
    this.title.textContent = snapshot.map.toUpperCase();
    this.meta.textContent = `${monsters} HOSTILE · ${players} PLAYER`;

    if (!this.context) return;

    const ctx = this.context;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const pad = 8;
    const innerWidth = width - pad * 2;
    const innerHeight = height - pad * 2;

    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#18282b");
    gradient.addColorStop(1, "#0d171a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(164, 198, 190, 0.08)";
    ctx.lineWidth = 1;
    for (let index = 1; index < 4; index += 1) {
      const x = pad + innerWidth * (index / 4);
      const y = pad + innerHeight * (index / 4);
      ctx.beginPath();
      ctx.moveTo(x, pad);
      ctx.lineTo(x, height - pad);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(width - pad, y);
      ctx.stroke();
    }

    const mapPoint = (x: number, y: number) => {
      const point = normalizeMinimapPoint(bounds, x, y);
      return {
        x: pad + point.x * innerWidth,
        y: pad + point.y * innerHeight
      };
    };

    ctx.strokeStyle = "rgba(209, 222, 204, 0.18)";
    ctx.lineWidth = 1;
    for (const [x, y1, y2] of snapshot.mapState?.geometry.collisionXLines ?? []) {
      const a = mapPoint(x, y1);
      const b = mapPoint(x, y2);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    for (const [y, x1, x2] of snapshot.mapState?.geometry.collisionYLines ?? []) {
      const a = mapPoint(x1, y);
      const b = mapPoint(x2, y);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    const entities = [...snapshot.entities].sort((a, b) =>
      Number(Boolean(a.local || a.targeted)) - Number(Boolean(b.local || b.targeted))
    );

    for (const entity of entities) {
      const point = mapPoint(entity.x, entity.y);
      const marker = markerStyle(entity);

      if (entity.targeted) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 213, 121, .9)";
        ctx.lineWidth = 1.4;
        ctx.arc(point.x, point.y, marker.radius + 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (entity.local) {
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.fillStyle = marker.fill;
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(5, 5);
        ctx.lineTo(0, 3);
        ctx.lineTo(-5, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        continue;
      }

      ctx.beginPath();
      ctx.fillStyle = marker.fill;
      ctx.arc(point.x, point.y, marker.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "rgba(226, 198, 125, .36)";
    ctx.lineWidth = 1;
    ctx.strokeRect(pad + .5, pad + .5, innerWidth - 1, innerHeight - 1);
  }

  private syncVisibility(): void {
    this.root.hidden = this.mode !== "2.5d" || !this.enabled;
  }

  clear(): void {
    this.lastKey = "";
    this.title.textContent = "MAIN";
    this.meta.textContent = "RADAR";
    this.context?.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  destroy(): void {
    this.clear();
    this.root.remove();
  }
}
