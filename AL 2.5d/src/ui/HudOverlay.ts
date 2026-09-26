import type { GraphicsMode } from "../legacy/LegacyCompatibilityRuntime";
import type {
  GameFrameSnapshot,
  RenderEquipmentSlot,
  RenderHotbarEntry,
  RenderInventorySlot,
  RenderPlayerUi,
  RenderSkillEntry,
  RenderPartyMember,
  RenderChatMessage,
  RenderChatChannel,
  RenderQuestEvent,
  RenderItemDetails
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
  reducedMotion: boolean;
  highContrast: boolean;
  cameraZoom: number;
  cameraRotation: number;
}>;

export type HudActions = Readonly<{
  onHotbar?: (key: string) => void;
  onToggleMinimap?: (visible: boolean) => void;
  onToggleCombatVfx?: (visible: boolean) => void;
  onToggleReducedMotion?: (enabled: boolean) => void;
  onToggleHighContrast?: (enabled: boolean) => void;
  onCameraZoom?: (zoom: number) => void;
  onResetView?: () => void;
  onInventoryEquip?: (index: number) => unknown;
  onInventorySwap?: (from: number, to: number) => unknown;
  onEquipmentUnequip?: (slot: string) => unknown;
  onChatSend?: (request: Readonly<{
    kind: "main" | "party" | "pm";
    message: string;
    peer?: string;
  }>) => unknown;
  onPartyInvite?: (name: string) => unknown;
  onPartyRequest?: (name: string) => unknown;
  onPartyAcceptInvite?: (name: string) => unknown;
  onPartyAcceptRequest?: (name: string) => unknown;
  onPartyKick?: (name: string) => unknown;
  onPartyLeave?: () => unknown;
}>;

type BarElements = Readonly<{
  root: HTMLDivElement;
  fill: HTMLElement;
  label: HTMLSpanElement;
}>;

type PanelName =
  | "character"
  | "inventory"
  | "skills"
  | "quests"
  | "party"
  | "chat"
  | "settings";

const DEFAULT_PRESENTATION_SETTINGS: HudPresentationSettings = Object.freeze({
  minimapVisible: true,
  combatVfxVisible: true,
  reducedMotion: false,
  highContrast: false,
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

function itemTypeLabel(value: string): string {
  return value
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function appendItemDetails(
  owner: HTMLElement,
  details: RenderItemDetails | undefined
): void {
  if (!details) return;

  const surface = document.createElement("section");
  surface.className = "al25d-item-details";

  const badges = document.createElement("div");
  badges.className = "al25d-item-detail-badges";

  for (const value of [
    details.type ? itemTypeLabel(details.type) : null,
    details.tier !== undefined ? `Tier ${details.tier}` : null,
    details.damageType ? itemTypeLabel(details.damageType) : null
  ]) {
    if (!value) continue;
    const badge = document.createElement("span");
    badge.textContent = value;
    badges.appendChild(badge);
  }

  if (badges.childElementCount) {
    surface.appendChild(badges);
  }

  if (details.explanation) {
    const explanation = document.createElement("p");
    explanation.textContent = details.explanation;
    surface.appendChild(explanation);
  }

  if (details.classes?.length) {
    const classes = document.createElement("small");
    classes.textContent =
      `Classes · ${details.classes.map(itemTypeLabel).join(", ")}`;
    surface.appendChild(classes);
  }

  if (details.stats.length) {
    const heading = document.createElement("h4");
    heading.textContent = "Definition stats";
    surface.appendChild(heading);

    const stats = document.createElement("div");
    stats.className = "al25d-item-stat-grid";

    for (const stat of details.stats) {
      const row = document.createElement("div");
      row.dataset.source = stat.source;

      const label = document.createElement("span");
      label.textContent = stat.label;
      const value = document.createElement("strong");
      value.textContent =
        stat.value > 0 ? `+${stat.value}` : String(stat.value);
      row.append(label, value);
      stats.appendChild(row);
    }

    surface.appendChild(stats);
  }

  owner.appendChild(surface);
}

export type PendingPartyAction = Readonly<{
  kind: "invite" | "request";
  name: string;
}>;

export function pendingPartyActions(
  messages: readonly RenderChatMessage[]
): readonly PendingPartyAction[] {
  const result: PendingPartyAction[] = [];
  const seen = new Set<string>();

  for (const message of messages) {
    if (typeof message.id !== "string") continue;

    const kind =
      message.id.startsWith("pin")
        ? "invite"
        : message.id.startsWith("rq")
          ? "request"
          : null;
    if (!kind) continue;

    const name = message.id.slice(kind === "invite" ? 3 : 2).trim();
    const key = `${kind}:${name}`;
    if (!name || seen.has(key)) continue;
    seen.add(key);
    result.push(Object.freeze({ kind, name }));
  }

  return Object.freeze(result);
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
  private latestChat: readonly RenderChatMessage[] = Object.freeze([]);
  private latestChatChannels: readonly RenderChatChannel[] = Object.freeze([]);
  private latestQuestEvents: readonly RenderQuestEvent[] = Object.freeze([]);
  private latestParty: readonly RenderPartyMember[] = Object.freeze([]);
  private latestMap = "main";
  private selectedChatChannelId = "main";
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
      ["quests", "QUEST", "Quests & Events"],
      ["party", "PARTY", "Party management"],
      ["chat", "CHAT", "Chat"],
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
    const chatKey = JSON.stringify(snapshot.chat ?? null);
    const chatChannelsKey = JSON.stringify(snapshot.chatChannels ?? null);
    const questEventsKey = JSON.stringify(snapshot.questEvents ?? null);
    const key =
      snapshot.map +
      JSON.stringify(model) +
      playerUiKey +
      partyKey +
      chatKey +
      chatChannelsKey +
      questEventsKey;

    if (key === this.lastKey) return;
    this.lastKey = key;
    this.latestPlayerUi = snapshot.playerUi;
    this.latestChat = snapshot.chat ?? Object.freeze([]);
    this.latestChatChannels =
      snapshot.chatChannels ??
      Object.freeze([
        Object.freeze({
          id: "main",
          kind: "main" as const,
          label: "MAIN",
          messages: this.latestChat
        })
      ]);
    this.latestQuestEvents = snapshot.questEvents ?? Object.freeze([]);
    this.latestParty = snapshot.party ?? Object.freeze([]);
    this.latestMap = snapshot.map;
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
    this.latestChat = Object.freeze([]);
    this.latestChatChannels = Object.freeze([]);
    this.latestQuestEvents = Object.freeze([]);
    this.latestParty = Object.freeze([]);
    this.selectedChatChannelId = "main";
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

  private renderPartyManager(
    members: readonly RenderPartyMember[]
  ): void {
    const shell = document.createElement("div");
    shell.className = "al25d-party-manager";

    const pending = pendingPartyActions(this.latestChat);
    if (pending.length) {
      const pendingSection = document.createElement("section");
      pendingSection.className = "al25d-party-pending";
      const pendingTitle = document.createElement("strong");
      pendingTitle.textContent = "PENDING";
      pendingSection.appendChild(pendingTitle);

      for (const action of pending) {
        const row = document.createElement("div");
        const copy = document.createElement("span");
        copy.textContent =
          action.kind === "invite"
            ? `${action.name} invited you`
            : `${action.name} wants to join`;

        const accept = document.createElement("button");
        accept.type = "button";
        accept.textContent = "ACCEPT";
        accept.disabled =
          action.kind === "invite"
            ? !this.actions.onPartyAcceptInvite
            : !this.actions.onPartyAcceptRequest;
        accept.addEventListener("click", () => {
          this.runPanelAction(
            action.kind === "invite"
              ? `Accept invite ← ${action.name}`
              : `Accept request ← ${action.name}`,
            () =>
              action.kind === "invite"
                ? this.actions.onPartyAcceptInvite!(action.name)
                : this.actions.onPartyAcceptRequest!(action.name)
          );
        });

        row.append(copy, accept);
        pendingSection.appendChild(row);
      }

      shell.appendChild(pendingSection);
    }

    const list = document.createElement("div");
    list.className = "al25d-party-manager-list";

    if (!members.length) {
      const empty = document.createElement("p");
      empty.className = "al25d-panel-empty";
      empty.textContent = "Keine aktive Party gespiegelt.";
      list.appendChild(empty);
    } else {
      for (const member of members) {
        const row = document.createElement("div");
        row.className = "al25d-party-manager-row";
        row.dataset.local = String(Boolean(member.local));
        row.dataset.remote = String(member.sameMap === false);

        const identity = document.createElement("div");
        const name = document.createElement("strong");
        name.textContent = member.name;
        const meta = document.createElement("span");
        meta.textContent = [
          member.local ? "YOU" : null,
          member.role,
          member.level !== undefined ? `Lv. ${member.level}` : null,
          member.map
        ].filter(Boolean).join(" · ");
        identity.append(name, meta);

        const actions = document.createElement("div");
        actions.className = "al25d-party-member-actions";
        const state = document.createElement("small");
        state.textContent =
          member.hp !== undefined &&
          member.maxHp !== undefined &&
          member.maxHp > 0
            ? `${Math.max(0, Math.round(member.hp))}/${Math.round(member.maxHp)} HP`
            : member.sameMap === false
              ? "REMOTE"
              : "ONLINE";
        actions.appendChild(state);

        if (!member.local) {
          const kick = document.createElement("button");
          kick.type = "button";
          kick.textContent = "KICK";
          kick.disabled = !this.actions.onPartyKick;
          kick.addEventListener("click", () => {
            if (!this.actions.onPartyKick) return;
            this.runPanelAction(
              `Kick ${member.name}`,
              () => this.actions.onPartyKick!(member.name)
            );
          });
          actions.appendChild(kick);
        }

        row.append(identity, actions);
        list.appendChild(row);
      }
    }

    const controls = document.createElement("form");
    controls.className = "al25d-party-controls";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Character name";
    input.maxLength = 64;
    input.autocomplete = "off";

    const invite = document.createElement("button");
    invite.type = "button";
    invite.textContent = "INVITE";
    invite.disabled = !this.actions.onPartyInvite;

    const request = document.createElement("button");
    request.type = "button";
    request.textContent = "REQUEST";
    request.disabled = !this.actions.onPartyRequest;

    const leave = document.createElement("button");
    leave.type = "button";
    leave.textContent = "LEAVE";
    leave.dataset.danger = "true";
    leave.disabled = !members.length || !this.actions.onPartyLeave;

    invite.addEventListener("click", () => {
      const name = input.value.trim();
      if (!name || !this.actions.onPartyInvite) return;
      this.runPanelAction(
        `Party invite → ${name}`,
        () => this.actions.onPartyInvite!(name)
      );
    });

    request.addEventListener("click", () => {
      const name = input.value.trim();
      if (!name || !this.actions.onPartyRequest) return;
      this.runPanelAction(
        `Party request → ${name}`,
        () => this.actions.onPartyRequest!(name)
      );
    });

    leave.addEventListener("click", () => {
      if (!this.actions.onPartyLeave) return;
      this.runPanelAction(
        "Leave party",
        () => this.actions.onPartyLeave!()
      );
    });

    controls.addEventListener("submit", (event) => {
      event.preventDefault();
      invite.click();
    });

    controls.append(input, invite, request, leave);
    shell.append(list, controls);
    this.panelBody.appendChild(shell);
  }

  private renderHotbar(entries: readonly RenderHotbarEntry[]): void {
    this.hotbar.replaceChildren();

    for (const entry of entries) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "al25d-hotbar-slot";
      button.dataset.visualKind = entry.visualKind;
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

    if (panel === "quests") {
      this.panelTitle.textContent = "Quests & Events";
      this.renderQuestEvents(this.latestQuestEvents);
      return;
    }

    if (panel === "party") {
      this.panelTitle.textContent = "Party";
      this.renderPartyManager(this.latestParty);
      return;
    }

    if (panel === "chat") {
      this.panelTitle.textContent = "Chat";
      this.renderChat(this.latestChatChannels);
      return;
    }

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
    appendItemDetails(copy, selected.details);

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
    appendItemDetails(copy, selected.details);

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

    list.appendChild(toggleRow(
      "Reduced Motion",
      "Minimize HUD and combat-effect animation",
      this.presentationSettings.reducedMotion,
      (next) => {
        this.presentationSettings = Object.freeze({
          ...this.presentationSettings,
          reducedMotion: next
        });
        this.actions.onToggleReducedMotion?.(next);
        this.renderPanel("settings");
      }
    ));

    list.appendChild(toggleRow(
      "High Contrast",
      "Stronger panel, text and focus contrast",
      this.presentationSettings.highContrast,
      (next) => {
        this.presentationSettings = Object.freeze({
          ...this.presentationSettings,
          highContrast: next
        });
        this.actions.onToggleHighContrast?.(next);
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

  private renderQuestEvents(rows: readonly RenderQuestEvent[]): void {
    const list = document.createElement("div");
    list.className = "al25d-quest-list";

    if (!rows.length) {
      const empty = document.createElement("p");
      empty.className = "al25d-panel-empty";
      empty.textContent = "Keine aktiven Quests oder Events gespiegelt.";
      list.appendChild(empty);
      this.panelBody.appendChild(list);
      return;
    }

    for (const entry of rows) {
      const card = document.createElement("article");
      card.className = "al25d-quest-card";
      card.dataset.kind = entry.kind;

      const badge = document.createElement("i");
      badge.textContent = entry.kind === "quest" ? "QUEST" : "EVENT";

      const body = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = entry.title;
      body.appendChild(title);

      if (entry.detail) {
        const detail = document.createElement("span");
        detail.textContent = entry.detail;
        body.appendChild(detail);
      }

      const metaValues = [
        entry.status,
        entry.map ? `Map: ${entry.map}` : null,
        entry.remaining !== undefined
          ? `${Math.max(0, Math.floor(entry.remaining))} remaining`
          : null,
        entry.expiresAt !== undefined
          ? `Ends ${new Date(entry.expiresAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
            })}`
          : null
      ].filter(Boolean);

      if (metaValues.length) {
        const meta = document.createElement("small");
        meta.textContent = metaValues.join(" · ");
        body.appendChild(meta);
      }

      if (entry.map) {
        const navigation = document.createElement("span");
        navigation.className = "al25d-quest-nav-hint";
        navigation.dataset.local = String(entry.map === this.latestMap);
        navigation.textContent =
          entry.map === this.latestMap
            ? `CURRENT AREA · ${entry.map}`
            : `ROUTE TARGET · ${entry.map}`;
        body.appendChild(navigation);
      }

      card.append(badge, body);
      list.appendChild(card);
    }

    this.panelBody.appendChild(list);
  }

  private renderChat(channels: readonly RenderChatChannel[]): void {
    const available: readonly RenderChatChannel[] = channels.length
      ? channels
      : Object.freeze([
          Object.freeze({
            id: "main",
            kind: "main" as const,
            label: "MAIN",
            messages: this.latestChat
          })
        ]);

    const existing =
      this.selectedChatChannelId === "pm:new"
        ? undefined
        : available.find(
            (channel) => channel.id === this.selectedChatChannelId
          );
    if (!existing && this.selectedChatChannelId !== "pm:new") {
      this.selectedChatChannelId = available[0]?.id ?? "main";
    }

    const current =
      this.selectedChatChannelId === "pm:new"
        ? undefined
        : available.find(
            (channel) => channel.id === this.selectedChatChannelId
          ) ?? available[0];

    const shell = document.createElement("div");
    shell.className = "al25d-chat-shell";

    const tabs = document.createElement("nav");
    tabs.className = "al25d-chat-channels";
    tabs.setAttribute("aria-label", "Chat channels");

    for (const channel of available) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.active = String(channel.id === current?.id);
      button.dataset.unread = String(Boolean(channel.unread));
      button.textContent =
        channel.kind === "pm" ? `PM · ${channel.label}` : channel.label;
      button.addEventListener("click", () => {
        this.selectedChatChannelId = channel.id;
        this.renderPanel("chat");
      });
      tabs.appendChild(button);
    }

    const newPm = document.createElement("button");
    newPm.type = "button";
    newPm.dataset.active = String(this.selectedChatChannelId === "pm:new");
    newPm.textContent = "+ PM";
    newPm.addEventListener("click", () => {
      this.selectedChatChannelId = "pm:new";
      this.renderPanel("chat");
    });
    tabs.appendChild(newPm);
    shell.appendChild(tabs);

    const messages = current?.messages ?? Object.freeze([]);
    const list = document.createElement("div");
    list.className = "al25d-chat-list";

    if (!messages.length) {
      const empty = document.createElement("p");
      empty.className = "al25d-panel-empty";
      empty.textContent =
        this.selectedChatChannelId === "pm:new"
          ? "Empfänger wählen und eine private Nachricht schreiben."
          : "Noch keine Nachrichten in diesem Kanal gespiegelt.";
      list.appendChild(empty);
    } else {
      for (const entry of messages.slice(-50)) {
        const row = document.createElement("div");
        row.className = "al25d-chat-entry";

        const owner = document.createElement("strong");
        owner.textContent =
          entry.owner && entry.owner !== "^"
            ? entry.owner
            : entry.owner === "^"
              ? "SYSTEM"
              : "GAME";

        const message = document.createElement("span");
        message.textContent = entry.message;

        if (entry.color) {
          row.style.setProperty("--al25d-chat-accent", entry.color);
        }

        if (entry.repeat && entry.repeat > 1) {
          const repeat = document.createElement("em");
          repeat.textContent = `×${entry.repeat}`;
          row.append(owner, message, repeat);
        } else {
          row.append(owner, message);
        }

        list.appendChild(row);
      }
    }
    shell.appendChild(list);

    const form = document.createElement("form");
    form.className = "al25d-chat-composer";

    const kind =
      this.selectedChatChannelId === "pm:new"
        ? "pm"
        : current?.kind ?? "main";

    let recipient: HTMLInputElement | null = null;
    if (kind === "pm") {
      recipient = document.createElement("input");
      recipient.type = "text";
      recipient.className = "al25d-chat-recipient";
      recipient.placeholder = "Recipient";
      recipient.maxLength = 64;
      recipient.autocomplete = "off";
      if (current?.peer) {
        recipient.value = current.peer;
        recipient.readOnly = true;
      }
      form.appendChild(recipient);
    }

    const input = document.createElement("input");
    input.type = "text";
    input.className = "al25d-chat-input";
    input.placeholder =
      kind === "party"
        ? "Message party…"
        : kind === "pm"
          ? "Private message…"
          : "Message…";
    input.maxLength = 2000;
    input.autocomplete = "off";

    const send = document.createElement("button");
    send.type = "submit";
    send.textContent = "SEND";

    form.append(input, send);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const message = input.value.trim();
      if (!message || !this.actions.onChatSend) return;

      const peer = recipient?.value.trim();
      this.runPanelAction(
        kind === "pm" ? `Message → ${peer || "?"}` : `Message → ${kind}`,
        () =>
          this.actions.onChatSend!({
            kind,
            message,
            ...(kind === "pm" && peer ? { peer } : {})
          })
      );
      input.value = "";
    });

    shell.appendChild(form);
    this.panelBody.appendChild(shell);
    queueMicrotask(() => {
      list.scrollTop = list.scrollHeight;
      input.focus();
    });
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
      row.dataset.visualKind = skill.visualKind;
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
