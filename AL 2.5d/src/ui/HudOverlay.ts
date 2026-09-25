import type { GraphicsMode } from "../legacy/LegacyCompatibilityRuntime";
import type { GameFrameSnapshot } from "../render/RenderBridge";
import {
  buildHudModel,
  type HudBarModel,
  type HudModel
} from "./HudModel";

type BarElements = Readonly<{
  root: HTMLDivElement;
  fill: HTMLElement;
  label: HTMLSpanElement;
}>;

function createBar(kind: "hp" | "mp" | "xp"): BarElements {
  const root = document.createElement("div");
  root.className = "al25d-hud-bar";
  root.dataset.kind = kind;

  const fill = document.createElement("i");
  const label = document.createElement("span");
  root.append(fill, label);

  return Object.freeze({ root, fill, label });
}

function setBar(
  elements: BarElements,
  model: HudBarModel | undefined,
  fallbackLabel: string
): void {
  elements.root.style.display = model ? "" : "none";
  elements.fill.style.width = `${(model?.ratio ?? 0) * 100}%`;
  elements.label.textContent = model?.text ?? fallbackLabel;
}

export class HudOverlay {
  private readonly root = document.createElement("div");
  private readonly playerFrame = document.createElement("section");
  private readonly playerPortrait = document.createElement("div");
  private readonly playerName = document.createElement("strong");
  private readonly playerMeta = document.createElement("span");
  private readonly playerHp = createBar("hp");
  private readonly playerMp = createBar("mp");
  private readonly playerXp = createBar("xp");
  private readonly xpCaption = document.createElement("span");

  private readonly targetFrame = document.createElement("section");
  private readonly targetName = document.createElement("strong");
  private readonly targetMeta = document.createElement("span");
  private readonly targetHp = createBar("hp");

  private lastKey = "";

  constructor(owner: HTMLElement = document.body) {
    this.root.id = "al25d-hud";
    this.root.hidden = true;

    this.playerFrame.id = "al25d-player-frame";
    this.playerFrame.className = "al25d-hud-frame";
    this.playerPortrait.className = "al25d-hud-portrait";
    this.playerName.className = "al25d-hud-name";
    this.playerMeta.className = "al25d-hud-meta";
    this.xpCaption.className = "al25d-hud-xp-caption";
    this.xpCaption.textContent = "EXPERIENCE";

    const playerHeading = document.createElement("div");
    playerHeading.className = "al25d-hud-heading";
    playerHeading.append(this.playerName, this.playerMeta);

    this.playerFrame.append(
      this.playerPortrait,
      playerHeading,
      this.playerHp.root,
      this.playerMp.root,
      this.playerXp.root,
      this.xpCaption
    );

    this.targetFrame.id = "al25d-target-frame";
    this.targetFrame.className = "al25d-hud-frame";
    this.targetFrame.dataset.empty = "true";
    this.targetName.className = "al25d-hud-name";
    this.targetMeta.className = "al25d-hud-meta";

    const targetHeading = document.createElement("div");
    targetHeading.className = "al25d-hud-heading";
    targetHeading.append(this.targetName, this.targetMeta);

    this.targetFrame.append(targetHeading, this.targetHp.root);
    this.root.append(this.playerFrame, this.targetFrame);
    owner.appendChild(this.root);
  }

  setMode(mode: GraphicsMode): void {
    this.root.hidden = mode !== "2.5d";
  }

  render(snapshot: GameFrameSnapshot): void {
    const model = buildHudModel(snapshot);
    const key = JSON.stringify(model);
    if (key === this.lastKey) return;
    this.lastKey = key;
    this.renderModel(model);
  }

  clear(): void {
    this.lastKey = "";
    this.renderModel({ player: null, target: null });
  }

  destroy(): void {
    this.root.remove();
  }

  private renderModel(model: HudModel): void {
    const player = model.player;
    this.playerFrame.style.display = player ? "" : "none";

    if (player) {
      this.playerPortrait.textContent = player.glyph;
      this.playerName.textContent = player.name;
      this.playerMeta.textContent = [
        player.role,
        player.level !== undefined ? `Lv. ${player.level}` : null
      ]
        .filter(Boolean)
        .join(" · ");

      setBar(this.playerHp, player.hp, "HP");
      setBar(this.playerMp, player.mp, "MP");
      setBar(this.playerXp, player.xp, "XP");

      if (player.xp) {
        this.playerXp.label.textContent =
          `${Math.floor(player.xp.ratio * 100)}% XP`;
      }
    }

    const target = model.target;
    this.targetFrame.dataset.empty = String(!target);

    if (target) {
      this.targetName.textContent = target.name;
      this.targetMeta.textContent = target.meta;
      setBar(this.targetHp, target.hp, "HP");
    }
  }
}
