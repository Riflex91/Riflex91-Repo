import { worldToViewport, type ViewportSize } from "../render/camera";
import type {
  CameraState,
  GameFrameSnapshot,
  RenderEntity
} from "../render/RenderBridge";
import type { GraphicsMode } from "../legacy/LegacyCompatibilityRuntime";

export type CombatFeedbackKind = "damage" | "heal" | "death";

export type CombatFeedbackEvent = Readonly<{
  entityId: string;
  kind: CombatFeedbackKind;
  amount?: number;
}>;

export type CombatFeedbackDiff = Readonly<{
  events: readonly CombatFeedbackEvent[];
  nextHp: ReadonlyMap<string, number>;
}>;

export function diffEntityHitPoints(
  previous: ReadonlyMap<string, number>,
  snapshot: GameFrameSnapshot
): CombatFeedbackDiff {
  const nextHp = new Map<string, number>();
  const events: CombatFeedbackEvent[] = [];

  for (const entity of snapshot.entities) {
    if (typeof entity.hp !== "number" || !Number.isFinite(entity.hp)) continue;

    nextHp.set(entity.id, entity.hp);
    const before = previous.get(entity.id);
    if (before === undefined || before === entity.hp) continue;

    const delta = entity.hp - before;
    if (delta < 0) {
      events.push(Object.freeze({
        entityId: entity.id,
        kind: "damage" as const,
        amount: Math.abs(delta)
      }));
    } else if (delta > 0) {
      events.push(Object.freeze({
        entityId: entity.id,
        kind: "heal" as const,
        amount: delta
      }));
    }

    if (before > 0 && entity.hp <= 0) {
      events.push(Object.freeze({
        entityId: entity.id,
        kind: "death" as const
      }));
    }
  }

  return Object.freeze({
    events: Object.freeze(events),
    nextHp
  });
}

function entityById(
  snapshot: GameFrameSnapshot,
  entityId: string
): RenderEntity | undefined {
  return snapshot.entities.find((entity) => entity.id === entityId);
}

export class CombatFeedbackOverlay {
  private readonly root = document.createElement("div");
  private previousHp: ReadonlyMap<string, number> = new Map();

  constructor(owner: HTMLElement = document.body) {
    this.root.id = "al25d-combat-feedback";
    this.root.hidden = true;
    owner.appendChild(this.root);
  }

  setMode(mode: GraphicsMode): void {
    this.root.hidden = mode !== "2.5d";
  }

  render(
    snapshot: GameFrameSnapshot,
    camera: CameraState,
    viewport: ViewportSize
  ): void {
    const diff = diffEntityHitPoints(this.previousHp, snapshot);
    this.previousHp = diff.nextHp;

    if (this.root.hidden) return;

    for (const event of diff.events) {
      const entity = entityById(snapshot, event.entityId);
      if (!entity) continue;

      if (event.kind === "death") {
        this.spawn(entity, "KO", "death", camera, viewport);
        continue;
      }

      const amount = Math.max(1, Math.round(event.amount ?? 0));
      this.spawn(
        entity,
        event.kind === "damage" ? `-${amount}` : `+${amount}`,
        event.kind,
        camera,
        viewport
      );
    }
  }

  pulse(
    entity: RenderEntity,
    camera: CameraState,
    viewport: ViewportSize
  ): void {
    if (this.root.hidden) return;

    const point = worldToViewport(entity, camera, viewport);
    const marker = document.createElement("span");
    marker.className = "al25d-combat-pulse";
    marker.style.left = `${point.x}px`;
    marker.style.top = `${point.y - 16 * camera.zoom}px`;
    this.root.appendChild(marker);
    this.removeAfterAnimation(marker, 540);
  }

  clear(): void {
    this.previousHp = new Map();
    this.root.replaceChildren();
  }

  destroy(): void {
    this.clear();
    this.root.remove();
  }

  private spawn(
    entity: RenderEntity,
    textValue: string,
    kind: CombatFeedbackKind,
    camera: CameraState,
    viewport: ViewportSize
  ): void {
    const point = worldToViewport(entity, camera, viewport);
    const node = document.createElement("span");
    node.className = "al25d-combat-float";
    node.dataset.kind = kind;
    node.textContent = textValue;
    node.style.left = `${point.x}px`;
    node.style.top = `${point.y - 34 * camera.zoom}px`;
    this.root.appendChild(node);
    this.removeAfterAnimation(node, kind === "death" ? 900 : 720);
  }

  private removeAfterAnimation(
    node: HTMLElement,
    fallbackMs: number
  ): void {
    const remove = () => node.remove();
    node.addEventListener("animationend", remove, { once: true });
    window.setTimeout(remove, fallbackMs);
  }
}
