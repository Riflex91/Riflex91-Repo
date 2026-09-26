import type { GraphicsMode } from "../legacy/LegacyCompatibilityRuntime";
import type {
  GameFrameSnapshot,
  RenderEquipmentSlot,
  RenderHotbarEntry,
  RenderInventorySlot,
  RenderPlayerUi,
  RenderSkillEntry,
  RenderPartyMember
} from "../render/RenderBridge";
import {
  buildHudModel,
  type HudBarModel,
  type HudModel,
  type PlayerHudModel
} from "./HudModel";

export type HudPresentationSettings = Readonly<{
  minimapVisible: boolean;
  combatVfxVisible: boolean;
  cameraZoom: number;
  cameraRotation: number;
}>;

export type HudActions = Readonly<{
  onHotbar?: (key: string) => void;
  onToggleMinimap?: (visible: boolean) => void;
  onToggleCombatVfx?: (visible: boolean) => void;
  onCameraZoom?: (zoom: number) => void;
  onResetView?: () => void;
  onInventoryEquip?: (index: number) => unknown;
  onInventorySwap?: (from: number, to: number) => unknown;
  onEquipmentUnequip?: (slot: string) => unknown;
}>;

type BarElements = Readonly<{
  root: HTMLDivElement;
  fill: HTMLElement;
  label: HTMLSpanElement;
}>;

type PanelName = "character" | "inventory" | "skills" | "settings";

const DEFAULT_PRESENTATION_SETTINGS: HudPresentationSettings = Object.freeze({
  minimapVisible: true,
  combatVfxVisible: true,
  cameraZoom: 1.5,
  cameraRotation: 0
});

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

function shortLabel(value: string, length = 10): string {
  return value.length <= length
    ? value
    : value.slice(0, Math.max(1, length - 1)) + "…";
}

function itemText(item: RenderInventorySlot | RenderEquipmentSlot): string {
  const name =
    "displayName" in item && item.displayName
      ? item.displayName
      : item.name ?? "Empty";
  const level =
    item.level !== undefined && item.level > 0 ? ` +${item.level}` : "";
  const quantity =
    item.quantity !== undefined && item.quantity > 1
      ? ` ×${item.quantity}`
      : "";
  return `${name}${level}${quantity}`;
}

function equipmentIcon(slot: string): string {
  const normalized = slot.toLowerCase();
  if (normalized.includes("helmet")) return "◈";
  if (normalized.includes("chest")) return "⬟";
  if (normalized.includes("glove")) return "◆";
  if (normalized.includes("pants")) return "▥";
  if (normalized.includes("shoe")) return "◇";
  if (normalized.includes("mainhand")) return "⚔";
  if (normalized.includes("offhand")) return "◐";
  if (normalized.includes("ring")) return "○";
  if (normalized.includes("earring")) return "◌";
  if (normalized.includes("belt")) return "═";
  if (normalized.includes("cape")) return "⌁";
  if (normalized.includes("orb")) return "✦";
  return "•";
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

  private readonly partyFrame = document.createElement("section");

  private readonly targetFrame = document.createElement("section");
  private readonly targetName = document.createElement("strong");
  private readonly targetMeta = document.createElement("span");
  private readonly targetHp = createBar("hp");

  private readonly menu = document.createElement("nav");
  private readonly panel = document.createElement("section");
  private readonly panelTitle = document.createElement("strong");
  private readonly panelBody = document.createElement("div");
  private readonly panelStatus = document.createElement("div");
  private readonly hotbar = document.createElement("div");

  private lastKey = "";
  private latestPlayerUi: RenderPlayerUi | undefined;
  private latestModel: HudModel = Object.freeze({ player: null, target: null });
  private presentationSettings: HudPresentationSettings =
    DEFAULT_PRESENTATION_SETTINGS;
  private selectedInventoryIndex: number | null = null;
  private selectedEquipmentSlot: string | null = null;
  private panelStatusTimer: number | null = null;
  private openPanel: PanelName | null = null;

  constructor(
    private readonly actions: HudActions = {},
    owner: HTMLElement = document.body
  ) {
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

    this.partyFrame.id = "al25d-party-frame";
    this.partyFrame.className = "al25d-hud-frame";
    this.partyFrame.style.display = "none";

        this.targetFrame.id = "al25d-target-frame";
    this.targetFrame.className = "al25d-hud-frame";
    this.targetFrame.dataset.empty = "true";
    this.targetName.className = "al25d-hud-name";
    this.targetMeta.className = "al25d-hud-meta";

    const targetHeading = document.createElement("div");
    targetHeading.className = "al25d-hud-heading";
    targetHeading.append(this.targetName, this.targetMeta);
    this.targetFrame.append(targetHeading, this.targetHp.root);

    this.menu.id = "al25d-menu";
    this.menu.setAttribute("aria-label", "AL 2.5D Menus");
    for (const [panel, label, title] of [
      ["character", "CHAR", "Character & Equipment"],
      ["inventory", "BAG", "Inventory"],
      ["skills", "SKILLS", "Skills"],
      ["settings", "SET", "Presentation settings"]
    ] as const) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.panel = panel;
      button.textContent = label;
      button.title = title;
      button.addEventListener("click", () => this.togglePanel(panel));
      this.menu.appendChild(button);
    }

    this.panel.id = "al25d-panel";
    this.panel.className = "al25d-hud-frame";
    this.panel.hidden = true;
    const panelHeader = document.createElement("header");
    this.panelTitle.className = "al25d-panel-title";
    const close = document.createElement("button");
    close.type = "button";
    close.className = "al25d-panel-close";
    close.textContent = "×";
    close.setAttribute("aria-label", "Panel schließen");
    close.addEventListener("click", () => this.togglePanel(null));
    panelHeader.append(this.panelTitle, close);
    this.panelBody.className = "al25d-panel-body";
    this.panelStatus.className = "al25d-panel-status";
    this.panelStatus.hidden = true;
    this.panel.append(panelHeader, this.panelBody, this.panelStatus);

    this.hotbar.id = "al25d-hotbar";

    this.root.append(
      this.playerFrame,
      this.partyFrame,
      this.targetFrame,
      this.menu,
      this.panel,
      this.hotbar
    );
    owner.appendChild(this.root);
  }

  setMode(mode: GraphicsMode): void {
    this.root.hidden = mode !== "2.5d";
  }

  render(snapshot: GameFrameSnapshot): void {
    const model = buildHudModel(snapshot);
    const playerUiKey = JSON.stringify(snapshot.playerUi ?? null);
    const partyKey = JSON.stringify(snapshot.party ?? null);
    const key = JSON.stringify(model) + playerUiKey + partyKey;

    if (key === this.lastKey) return;
    this.lastKey = key;
    this.latestPlayerUi = snapshot.playerUi;
    this.latestModel = model;
    this.renderModel(model);
    this.renderParty(snapshot.party ?? []);
    this.renderHotbar(snapshot.playerUi?.hotbar ?? []);

    if (this.openPanel) {
      this.renderPanel(this.openPanel);
    }
  }

  setPresentationSettings(settings: HudPresentationSettings): void {
    this.presentationSettings = Object.freeze({ ...settings });
    if (this.openPanel === "settings") {
      this.renderPanel("settings");
    }
  }

  clear(): void {
    this.lastKey = "";
    this.latestPlayerUi = undefined;
    this.latestModel = Object.freeze({ player: null, target: null });
    this.selectedInventoryIndex = null;
    this.selectedEquipmentSlot = null;
    this.openPanel = null;
    this.panel.hidden = true;
    if (this.panelStatusTimer !== null) {
      window.clearTimeout(this.panelStatusTimer);
      this.panelStatusTimer = null;
    }
    this.panelStatus.hidden = true;
    this.panelStatus.textContent = "";
    this.renderModel(this.latestModel);
    this.renderParty([]);
    this.renderHotbar([]);
  }

  destroy(): void {
    this.root.remove();
  }

  private togglePanel(panel: PanelName | null): void {
    this.openPanel = panel && panel !== this.openPanel ? panel : null;
    this.panel.hidden = this.openPanel === null;
    this.panel.dataset.panel = this.openPanel ?? "";

    for (const button of this.menu.querySelectorAll<HTMLButtonElement>("button")) {
      button.dataset.active = String(button.dataset.panel === this.openPanel);
    }

    if (this.openPanel) {
      this.renderPanel(this.openPanel);
    }
  }

  private renderParty(members: readonly RenderPartyMember[]): void {
    const visible = members.filter((member) => !member.local).slice(0, 5);
    this.partyFrame.style.display = visible.length ? "" : "none";
    this.partyFrame.replaceChildren();

    if (!visible.length) return;

    const heading = document.createElement("header");
    const title = document.createElement("strong");
    title.textContent = "PARTY";
    const count = document.createElement("span");
    count.textContent = `${visible.length + 1} MEMBERS`;
    heading.append(title, count);
    this.partyFrame.appendChild(heading);

    for (const member of visible) {
      const row = document.createElement("div");
      row.className = "al25d-party-member";
      row.dataset.dead = String(
        member.hp !== undefined && member.hp <= 0
      );
      row.dataset.remote = String(member.sameMap === false);

      const portrait = document.createElement("i");
      const role = member.role ?? "Adventurer";
      portrait.textContent = role.slice(0, 2).toUpperCase();

      const body = document.createElement("div");
      body.className = "al25d-party-member-body";

      const top = document.createElement("div");
      top.className = "al25d-party-member-heading";
      const name = document.createElement("strong");
      name.textContent = member.name;
      const meta = document.createElement("span");
      meta.textContent = [
        member.role,
        member.level !== undefined ? `Lv. ${member.level}` : null,
        member.sameMap === false
          ? member.map ?? "OTHER MAP"
          : member.distance !== undefined
            ? `${Math.round(member.distance)}u`
            : member.map
      ].filter(Boolean).join(" · ");
      top.append(name, meta);

      const bars = document.createElement("div");
      bars.className = "al25d-party-bars";

      for (const [kind, current, maximum] of [
        ["hp", member.hp, member.maxHp],
        ["mp", member.mp, member.maxMp]
      ] as const) {
        if (
          current === undefined ||
          maximum === undefined ||
          maximum <= 0
        ) {
          continue;
        }

        const bar = document.createElement("span");
        bar.dataset.kind = kind;
        const fill = document.createElement("i");
        fill.style.width =
          `${Math.max(0, Math.min(1, current / maximum)) * 100}%`;
        bar.appendChild(fill);
        bars.appendChild(bar);
      }

      body.append(top, bars);
      row.append(portrait, body);
      this.partyFrame.appendChild(row);
    }
  }

  private renderHotbar(entries: readonly RenderHotbarEntry[]): void {
    this.hotbar.replaceChildren();

    for (const entry of entries) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "al25d-hotbar-slot";
      button.title = `${entry.key}: ${entry.label}`;
      button.addEventListener("click", () => this.actions.onHotbar?.(entry.key));

      const key = document.createElement("kbd");
      key.textContent = entry.key;
      const label = document.createElement("span");
      label.textContent = shortLabel(entry.label, 11);
      button.append(key, label);
      this.hotbar.appendChild(button);
    }
  }

  private renderPanel(panel: PanelName): void {
    const playerUi = this.latestPlayerUi;
    this.panelBody.replaceChildren();

    if (panel === "settings") {
      this.panelTitle.textContent = "Settings";
      this.renderSettings();
      return;
    }

    if (!playerUi) {
      this.panelTitle.textContent = "Loading";
      this.panelBody.textContent = "Spielzustand wird geladen …";
      return;
    }

    if (panel === "character") {
      this.panelTitle.textContent = "Character";
      this.renderCharacter(playerUi, this.latestModel.player);
      return;
    }

    if (panel === "inventory") {
      this.panelTitle.textContent = "Inventory";
      this.renderInventory(playerUi.inventory);
      return;
    }

    this.panelTitle.textContent = "Skills";
    this.renderSkills(playerUi.skills);
  }

  private renderCharacter(
    playerUi: RenderPlayerUi,
    player: PlayerHudModel | null
  ): void {
    const shell = document.createElement("div");
    shell.className = "al25d-character-shell";

    const profile = document.createElement("section");
    profile.className = "al25d-character-profile";

    const portrait = document.createElement("div");
    portrait.className = "al25d-character-portrait";
    portrait.textContent = player?.glyph ?? "??";

    const identity = document.createElement("div");
    identity.className = "al25d-character-identity";
    const name = document.createElement("strong");
    name.textContent = player?.name ?? "Adventurer";
    const meta = document.createElement("span");
    meta.textContent = [
      player?.role,
      player?.level !== undefined ? `Level ${player.level}` : null
    ].filter(Boolean).join(" · ");
    identity.append(name, meta);

    const vitals = document.createElement("div");
    vitals.className = "al25d-character-vitals";
    for (const [label, bar, kind] of [
      ["HP", player?.hp, "hp"],
      ["MP", player?.mp, "mp"],
      ["XP", player?.xp, "xp"]
    ] as const) {
      if (!bar) continue;
      const row = document.createElement("div");
      row.className = "al25d-character-vital";
      row.dataset.kind = kind;
      const caption = document.createElement("span");
      caption.textContent = label;
      const track = document.createElement("i");
      const fill = document.createElement("b");
      fill.style.width = `${bar.ratio * 100}%`;
      track.appendChild(fill);
      const value = document.createElement("em");
      value.textContent = bar.text;
      row.append(caption, track, value);
      vitals.appendChild(row);
    }

    profile.append(portrait, identity, vitals);

    const equipment = document.createElement("section");
    equipment.className = "al25d-character-equipment";
    const equipmentTitle = document.createElement("h3");
    equipmentTitle.textContent = "Equipment";
    equipment.appendChild(equipmentTitle);
    this.renderEquipment(playerUi.equipment, equipment);

    const bag = document.createElement("section");
    bag.className = "al25d-character-bag";
    const bagHeader = document.createElement("div");
    bagHeader.className = "al25d-character-section-header";
    const bagTitle = document.createElement("h3");
    bagTitle.textContent = "Inventory";
    const used = playerUi.inventory.filter((item) => item.name).length;
    const count = document.createElement("span");
    count.textContent = `${used}/${playerUi.inventory.length}`;
    bagHeader.append(bagTitle, count);
    bag.appendChild(bagHeader);
    this.renderInventory(playerUi.inventory, bag, true);

    shell.append(profile, equipment, bag);
    this.panelBody.appendChild(shell);
  }

  private renderInventory(
    items: readonly RenderInventorySlot[],
    owner: HTMLElement = this.panelBody,
    compact = false
  ): void {
    const grid = document.createElement("div");
    grid.className = "al25d-inventory-grid";
    grid.dataset.compact = String(compact);

    for (const item of items) {
      const cell = document.createElement("div");
      cell.className = "al25d-item-cell";
      cell.dataset.empty = String(!item.name);
      cell.dataset.selected = String(
        item.name && item.index === this.selectedInventoryIndex
      );
      cell.title = item.name
        ? `${itemText(item)} · auswählen; per Drag & Drop verschieben`
        : `Slot ${item.index + 1}`;

      const index = document.createElement("small");
      index.textContent = String(item.index + 1);
      const icon = document.createElement("i");
      icon.textContent = item.name
        ? (item.displayName ?? item.name).slice(0, 1).toUpperCase()
        : "";
      const label = document.createElement("span");
      label.textContent = item.name
        ? shortLabel(item.displayName ?? item.name, compact ? 7 : 9)
        : "";
      const detail = document.createElement("em");
      detail.textContent = item.name
        ? [
            item.level !== undefined && item.level > 0 ? `+${item.level}` : "",
            item.quantity !== undefined && item.quantity > 1 ? `×${item.quantity}` : ""
          ].filter(Boolean).join(" ")
        : "";

      cell.append(index, icon, label, detail);

      if (item.name) {
        cell.dataset.interactive = "true";
        cell.tabIndex = 0;
        cell.setAttribute("role", "button");
        cell.setAttribute(
          "aria-label",
          `${itemText(item)}, Inventarslot ${item.index + 1}`
        );
        cell.draggable = true;
        cell.addEventListener("click", () => {
          this.selectedInventoryIndex = item.index;
          this.selectedEquipmentSlot = null;
          this.refreshOpenPanel();
        });
        cell.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          this.selectedInventoryIndex = item.index;
          this.selectedEquipmentSlot = null;
          this.refreshOpenPanel();
        });
        cell.addEventListener("dragstart", (event) => {
          event.dataTransfer?.setData(
            "application/x-al25d-inventory-index",
            String(item.index)
          );
          if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
        });
      }

      cell.addEventListener("dragover", (event) => {
        if (!this.actions.onInventorySwap) return;
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      });
      cell.addEventListener("drop", (event) => {
        if (!this.actions.onInventorySwap) return;

        event.preventDefault();
        const raw = event.dataTransfer?.getData(
          "application/x-al25d-inventory-index"
        );
        const from = Number(raw);

        if (!Number.isInteger(from) || from < 0 || from === item.index) return;

        this.runPanelAction(
          `Move ${from + 1} → ${item.index + 1}`,
          () => this.actions.onInventorySwap!(from, item.index)
        );
      });

      grid.appendChild(cell);
    }

    owner.appendChild(grid);

    const selected = items.find(
      (item) => item.name && item.index === this.selectedInventoryIndex
    );
    if (!selected?.name) return;

    const inspector = document.createElement("div");
    inspector.className = "al25d-item-inspector";

    const copy = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = itemText(selected);
    const meta = document.createElement("span");
    meta.textContent =
      `Inventory slot ${selected.index + 1} · ` +
      "Drag auf einen anderen Slot zum Verschieben";
    copy.append(name, meta);

    const actions = document.createElement("div");
    actions.className = "al25d-item-actions";
    const equip = document.createElement("button");
    equip.type = "button";
    equip.textContent = "EQUIP";
    equip.disabled = !this.actions.onInventoryEquip;
    equip.addEventListener("click", () => {
      if (!this.actions.onInventoryEquip) return;
      this.runPanelAction(
        `Equip ${selected.displayName ?? selected.name}`,
        () => this.actions.onInventoryEquip!(selected.index)
      );
    });
    actions.appendChild(equip);

    inspector.append(copy, actions);
    owner.appendChild(inspector);
  }

  private renderEquipment(
    items: readonly RenderEquipmentSlot[],
    owner: HTMLElement = this.panelBody
  ): void {
    const grid = document.createElement("div");
    grid.className = "al25d-equipment-grid";

    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "al25d-panel-empty";
      empty.textContent = "Keine Ausrüstung gespiegelt.";
      grid.appendChild(empty);
    }

    for (const item of items) {
      const row = document.createElement("div");
      row.className = "al25d-equipment-row";
      row.dataset.selected = String(
        item.slot === this.selectedEquipmentSlot
      );
      row.title = `${itemText(item)} · auswählen`;
      row.tabIndex = 0;
      row.setAttribute("role", "button");
      row.setAttribute(
        "aria-label",
        `${item.slot}: ${itemText(item)}`
      );
      row.addEventListener("click", () => {
        this.selectedEquipmentSlot = item.slot;
        this.selectedInventoryIndex = null;
        this.refreshOpenPanel();
      });
      row.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        this.selectedEquipmentSlot = item.slot;
        this.selectedInventoryIndex = null;
        this.refreshOpenPanel();
      });

      const icon = document.createElement("i");
      icon.textContent = equipmentIcon(item.slot);
      const slot = document.createElement("strong");
      slot.textContent = item.slot.toUpperCase();
      const name = document.createElement("span");
      name.textContent = itemText(item);
      row.append(icon, slot, name);
      grid.appendChild(row);
    }

    owner.appendChild(grid);

    const selected = items.find(
      (item) => item.slot === this.selectedEquipmentSlot
    );
    if (!selected) return;

    const inspector = document.createElement("div");
    inspector.className = "al25d-item-inspector";

    const copy = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = itemText(selected);
    const meta = document.createElement("span");
    meta.textContent = `Equipment slot · ${selected.slot}`;
    copy.append(name, meta);

    const actions = document.createElement("div");
    actions.className = "al25d-item-actions";
    const unequip = document.createElement("button");
    unequip.type = "button";
    unequip.textContent = "UNEQUIP";
    unequip.disabled = !this.actions.onEquipmentUnequip;
    unequip.addEventListener("click", () => {
      if (!this.actions.onEquipmentUnequip) return;
      this.runPanelAction(
        `Unequip ${selected.displayName}`,
        () => this.actions.onEquipmentUnequip!(selected.slot)
      );
    });
    actions.appendChild(unequip);

    inspector.append(copy, actions);
    owner.appendChild(inspector);
  }

  private refreshOpenPanel(): void {
    if (this.openPanel) this.renderPanel(this.openPanel);
  }

  private runPanelAction(
    label: string,
    action: () => unknown
  ): void {
    try {
      const result = action();
      this.showPanelStatus(`${label} …`, "pending");

      if (
        result &&
        (typeof result === "object" || typeof result === "function") &&
        typeof (result as { then?: unknown }).then === "function"
      ) {
        void Promise.resolve(result as PromiseLike<unknown>).then(
          () => this.showPanelStatus(`${label} ✓`, "success"),
          (error) => this.showPanelStatus(
            error instanceof Error
              ? error.message
              : `${label} fehlgeschlagen`,
            "error"
          )
        );
        return;
      }

      this.showPanelStatus(`${label} ✓`, "success");
    } catch (error) {
      this.showPanelStatus(
        error instanceof Error
          ? error.message
          : `${label} fehlgeschlagen`,
        "error"
      );
    }
  }

  private showPanelStatus(
    text: string,
    kind: "pending" | "success" | "error"
  ): void {
    if (this.panelStatusTimer !== null) {
      window.clearTimeout(this.panelStatusTimer);
    }

    this.panelStatus.hidden = false;
    this.panelStatus.dataset.kind = kind;
    this.panelStatus.textContent = text.slice(0, 160);
    this.panelStatusTimer = window.setTimeout(() => {
      this.panelStatus.hidden = true;
      this.panelStatus.textContent = "";
      this.panelStatusTimer = null;
    }, 2400);
  }

  private renderSettings(): void {
    const list = document.createElement("div");
    list.className = "al25d-settings-list";

    const toggleRow = (
      labelText: string,
      detailText: string,
      enabled: boolean,
      onChange: (next: boolean) => void
    ): HTMLDivElement => {
      const row = document.createElement("div");
      row.className = "al25d-settings-row";

      const copy = document.createElement("div");
      const label = document.createElement("strong");
      label.textContent = labelText;
      const detail = document.createElement("span");
      detail.textContent = detailText;
      copy.append(label, detail);

      const button = document.createElement("button");
      button.type = "button";
      button.dataset.active = String(enabled);
      button.textContent = enabled ? "ON" : "OFF";
      button.addEventListener("click", () => onChange(!enabled));

      row.append(copy, button);
      return row;
    };

    list.appendChild(toggleRow(
      "Minimap",
      "Read-only world radar",
      this.presentationSettings.minimapVisible,
      (next) => {
        this.presentationSettings = Object.freeze({
          ...this.presentationSettings,
          minimapVisible: next
        });
        this.actions.onToggleMinimap?.(next);
        this.renderPanel("settings");
      }
    ));

    list.appendChild(toggleRow(
      "Combat VFX",
      "Slash, impacts and floating feedback",
      this.presentationSettings.combatVfxVisible,
      (next) => {
        this.presentationSettings = Object.freeze({
          ...this.presentationSettings,
          combatVfxVisible: next
        });
        this.actions.onToggleCombatVfx?.(next);
        this.renderPanel("settings");
      }
    ));

    const camera = document.createElement("div");
    camera.className = "al25d-settings-row al25d-settings-camera";

    const cameraCopy = document.createElement("div");
    const cameraLabel = document.createElement("strong");
    cameraLabel.textContent = "Camera";
    const cameraDetail = document.createElement("span");
    cameraDetail.textContent =
      `Zoom ${this.presentationSettings.cameraZoom.toFixed(2)} · ` +
      `Rotation ${Math.round(this.presentationSettings.cameraRotation * 180 / Math.PI)}°`;
    cameraCopy.append(cameraLabel, cameraDetail);

    const presets = document.createElement("div");
    presets.className = "al25d-settings-presets";
    for (const [labelText, zoom] of [
      ["WIDE", 1.05],
      ["DEFAULT", 1.5],
      ["CLOSE", 1.9]
    ] as const) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = labelText;
      button.dataset.active = String(
        Math.abs(this.presentationSettings.cameraZoom - zoom) < 0.05
      );
      button.addEventListener("click", () => {
        this.presentationSettings = Object.freeze({
          ...this.presentationSettings,
          cameraZoom: zoom
        });
        this.actions.onCameraZoom?.(zoom);
        this.renderPanel("settings");
      });
      presets.appendChild(button);
    }

    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "al25d-settings-reset";
    reset.textContent = "RESET VIEW";
    reset.addEventListener("click", () => {
      this.presentationSettings = Object.freeze({
        ...this.presentationSettings,
        cameraZoom: 1.5,
        cameraRotation: 0
      });
      this.actions.onResetView?.();
      this.renderPanel("settings");
    });

    camera.append(cameraCopy, presets, reset);
    list.appendChild(camera);
    this.panelBody.appendChild(list);
  }

  private renderSkills(skills: readonly RenderSkillEntry[]): void {
    const list = document.createElement("div");
    list.className = "al25d-skill-list";

    if (!skills.length) {
      const empty = document.createElement("p");
      empty.className = "al25d-panel-empty";
      empty.textContent = "Keine klassenspezifischen Skills gespiegelt.";
      list.appendChild(empty);
    }

    for (const skill of skills) {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "al25d-skill-row";
      row.disabled = !skill.key;
      row.title = skill.key
        ? `${skill.label} [${skill.key}]`
        : `${skill.label} ist aktuell keinem Original-Hotkey zugeordnet`;

      const icon = document.createElement("i");
      icon.textContent = skill.label.slice(0, 2).toUpperCase();
      const name = document.createElement("strong");
      name.textContent = skill.label;
      const meta = document.createElement("span");
      meta.textContent = [
        skill.key ? `[${skill.key}]` : null,
        skill.requiredLevel !== undefined ? `Lv. ${skill.requiredLevel}` : null,
        skill.mp !== undefined ? `${skill.mp} MP` : null
      ].filter(Boolean).join(" · ");

      row.append(icon, name, meta);
      if (skill.key) {
        row.addEventListener("click", () => this.actions.onHotbar?.(skill.key!));
      }
      list.appendChild(row);
    }

    this.panelBody.appendChild(list);
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
      ].filter(Boolean).join(" · ");

      setBar(this.playerHp, player.hp, "HP");
      setBar(this.playerMp, player.mp, "MP");
      setBar(this.playerXp, player.xp, "XP");

      if (player.xp) {
        this.playerXp.label.textContent = `${Math.floor(player.xp.ratio * 100)}% XP`;
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
