import { worldToViewport, type ViewportSize } from "../render/camera";
import type {
  CameraState,
  GameFrameSnapshot,
  RenderEntity,
  RenderSkillVisualKind,
  RenderLootChest
} from "../render/RenderBridge";
import type { GraphicsMode } from "../legacy/LegacyCompatibilityRuntime";

export type CombatFeedbackKind =
  | "damage"
  | "heal"
  | "death"
  | "respawn";

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
    } else if (before <= 0 && entity.hp > 0) {
      events.push(Object.freeze({
        entityId: entity.id,
        kind: "respawn" as const
      }));
    }
  }

  return Object.freeze({
    events: Object.freeze(events),
    nextHp
  });
}

export type LootChestDiff = Readonly<{
  removed: readonly RenderLootChest[];
  next: ReadonlyMap<string, RenderLootChest>;
}>;

export function diffLootChests(
  previous: ReadonlyMap<string, RenderLootChest>,
  snapshot: GameFrameSnapshot
): LootChestDiff {
  const next = new Map<string, RenderLootChest>(
    (snapshot.lootChests ?? []).map((chest) => [chest.id, chest])
  );
  const removed: RenderLootChest[] = [];

  for (const [id, chest] of previous) {
    if (!next.has(id)) removed.push(chest);
  }

  return Object.freeze({
    removed: Object.freeze(removed),
    next
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
  private previousLoot: ReadonlyMap<string, RenderLootChest> = new Map();
  private previousMap: string | null = null;
  private mode: GraphicsMode = "original";
  private enabled = true;

  constructor(owner: HTMLElement = document.body) {
    this.root.id = "al25d-combat-feedback";
    this.root.hidden = true;
    owner.appendChild(this.root);
  }

  setMode(mode: GraphicsMode): void {
    this.mode = mode;
    this.syncVisibility();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.syncVisibility();
  }

  render(
    snapshot: GameFrameSnapshot,
    camera: CameraState,
    viewport: ViewportSize
  ): void {
    const diff = diffEntityHitPoints(this.previousHp, snapshot);
    this.previousHp = diff.nextHp;

    const lootDiff = diffLootChests(
      this.previousMap === snapshot.map
        ? this.previousLoot
        : new Map<string, RenderLootChest>(),
      snapshot
    );
    this.previousLoot = lootDiff.next;
    this.previousMap = snapshot.map;

    if (this.root.hidden) return;

    for (const chest of lootDiff.removed) {
      this.spawnLootOpened(chest, camera, viewport);
    }

    for (const event of diff.events) {
      const entity = entityById(snapshot, event.entityId);
      if (!entity) continue;

      if (event.kind === "death") {
        this.spawn(entity, "DEFEATED", "death", camera, viewport);
        this.impact(entity, camera, viewport, "death");
        continue;
      }

      if (event.kind === "respawn") {
        this.spawn(entity, "READY", "respawn", camera, viewport);
        this.impact(entity, camera, viewport, "respawn");
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

      if (event.kind === "damage") {
        this.impact(entity, camera, viewport, "hit");
      }
    }
  }

  attack(
    attacker: RenderEntity,
    target: RenderEntity,
    camera: CameraState,
    viewport: ViewportSize
  ): void {
    if (this.root.hidden) return;

    const start = worldToViewport(attacker, camera, viewport);
    const end = worldToViewport(target, camera, viewport);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.max(18, Math.min(220, Math.hypot(dx, dy)));
    const angle = Math.atan2(dy, dx);

    const trail = document.createElement("span");
    trail.className = "al25d-attack-trail";
    trail.style.left = `${start.x}px`;
    trail.style.top = `${start.y - 18 * camera.zoom}px`;
    trail.style.width = `${distance}px`;
    trail.style.transform = `rotate(${angle}rad)`;
    this.root.appendChild(trail);
    this.removeAfterAnimation(trail, 360);

    this.impact(target, camera, viewport, "attack");
  }

  action(
    entity: RenderEntity,
    key: string,
    camera: CameraState,
    viewport: ViewportSize,
    visualKind: RenderSkillVisualKind = "utility"
  ): void {
    if (this.root.hidden) return;

    const point = worldToViewport(entity, camera, viewport);
    const flare = document.createElement("span");
    flare.className = "al25d-action-flare";
    flare.dataset.kind = visualKind;
    flare.style.left = `${point.x}px`;
    flare.style.top = `${point.y - 18 * camera.zoom}px`;

    const label = document.createElement("b");
    label.textContent = key.toUpperCase();
    flare.appendChild(label);
    this.root.appendChild(flare);
    this.removeAfterAnimation(flare, 520);
  }

  pulse(
    entity: RenderEntity,
    camera: CameraState,
    viewport: ViewportSize
  ): void {
    this.impact(entity, camera, viewport, "attack");
  }

  private syncVisibility(): void {
    this.root.hidden = this.mode !== "2.5d" || !this.enabled;
  }

  clear(): void {
    this.previousHp = new Map();
    this.previousLoot = new Map();
    this.previousMap = null;
    this.root.replaceChildren();
  }

  destroy(): void {
    this.clear();
    this.root.remove();
  }

  private spawnLootOpened(
    chest: RenderLootChest,
    camera: CameraState,
    viewport: ViewportSize
  ): void {
    const point = worldToViewport(chest, camera, viewport);
    const marker = document.createElement("span");
    marker.className = "al25d-loot-feedback";
    marker.style.left = `${point.x}px`;
    marker.style.top = `${point.y - 22 * camera.zoom}px`;

    const icon = document.createElement("i");
    icon.textContent = "✦";
    const text = document.createElement("b");
    text.textContent = "CHEST OPENED";

    marker.append(icon, text);
    this.root.appendChild(marker);
    this.removeAfterAnimation(marker, 860);
  }

  private impact(
    entity: RenderEntity,
    camera: CameraState,
    viewport: ViewportSize,
    kind: "attack" | "hit" | "death" | "respawn"
  ): void {
    if (this.root.hidden) return;

    const point = worldToViewport(entity, camera, viewport);
    const marker = document.createElement("span");
    marker.className = "al25d-combat-pulse";
    marker.dataset.kind = kind;
    marker.style.left = `${point.x}px`;
    marker.style.top = `${point.y - 16 * camera.zoom}px`;

    const spark = document.createElement("i");
    marker.appendChild(spark);
    this.root.appendChild(marker);
    this.removeAfterAnimation(marker, kind === "death" ? 720 : 540);
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
    this.removeAfterAnimation(
      node,
      kind === "death" || kind === "respawn" ? 940 : 720
    );
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
