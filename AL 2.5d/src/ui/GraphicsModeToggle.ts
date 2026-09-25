import type { GraphicsMode } from "../legacy/LegacyCompatibilityRuntime";

const DEFAULT_SIZE = 46;
const DOCK_GAP = 6;

function findLegacyCloseButton(legacyDocument: Document): HTMLElement | null {
  const root = legacyDocument.querySelector("#toprightcorner");
  if (!root) return null;

  const candidates = Array.from(
    root.querySelectorAll<HTMLElement>(".gamebutton, button, [role='button']")
  );

  const exact = candidates.filter(
    (candidate) => candidate.textContent?.trim().toUpperCase() === "X"
  );

  if (!exact.length) return null;

  return exact.sort(
    (a, b) =>
      b.getBoundingClientRect().right - a.getBoundingClientRect().right
  )[0] ?? null;
}

export class GraphicsModeToggle {
  private readonly button: HTMLButtonElement;
  private mode: GraphicsMode = "2.5d";
  private legacyDocument: Document | null = null;
  private dockTimer: number | null = null;

  constructor(
    private readonly onToggle: (nextMode: GraphicsMode) => void,
    owner: HTMLElement = document.body
  ) {
    this.button = document.createElement("button");
    this.button.id = "al25d-graphics-toggle";
    this.button.type = "button";
    this.button.disabled = true;
    this.button.setAttribute("aria-label", "Grafikmodus wechseln");
    this.button.addEventListener("click", () => {
      if (this.button.disabled) return;
      const nextMode: GraphicsMode =
        this.mode === "2.5d" ? "original" : "2.5d";
      this.onToggle(nextMode);
    });
    owner.appendChild(this.button);
    this.render();
  }

  setReady(ready: boolean): void {
    this.button.disabled = !ready;
    this.render();
  }

  setMode(mode: GraphicsMode): void {
    this.mode = mode;
    this.render();
  }

  dockToLegacyUi(legacyDocument: Document | null): void {
    this.legacyDocument = legacyDocument;
    this.stopDockTimer();

    if (!legacyDocument) {
      this.button.dataset.docked = "false";
      this.resetDockPosition();
      return;
    }

    const update = () => this.updateDockPosition();
    update();
    this.dockTimer = window.setInterval(update, 250);
  }

  destroy(): void {
    this.stopDockTimer();
    this.button.remove();
  }

  private updateDockPosition(): void {
    const legacyDocument = this.legacyDocument;
    if (!legacyDocument) return;

    const closeButton = findLegacyCloseButton(legacyDocument);

    if (!closeButton) {
      this.button.dataset.docked = "false";
      this.resetDockPosition();
      return;
    }

    const rect = closeButton.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const size = Math.max(
      38,
      Math.min(50, Math.round(Math.max(rect.height, rect.width)))
    );
    const left = Math.max(4, Math.round(rect.left - size - DOCK_GAP));
    const top = Math.max(4, Math.round(rect.top + (rect.height - size) / 2));

    this.button.dataset.docked = "true";
    this.button.style.left = `${left}px`;
    this.button.style.top = `${top}px`;
    this.button.style.right = "auto";
    this.button.style.width = `${size || DEFAULT_SIZE}px`;
    this.button.style.height = `${size || DEFAULT_SIZE}px`;
  }

  private resetDockPosition(): void {
    this.button.style.left = "";
    this.button.style.top = "";
    this.button.style.right = "";
    this.button.style.width = "";
    this.button.style.height = "";
  }

  private stopDockTimer(): void {
    if (this.dockTimer === null) return;
    window.clearInterval(this.dockTimer);
    this.dockTimer = null;
  }

  private render(): void {
    const original = this.mode === "original";
    this.button.textContent = original ? "ORG" : "2.5D";
    this.button.dataset.mode = this.mode;
    this.button.title = this.button.disabled
      ? "Grafikwechsel ist verfügbar, sobald der lokale Spielclient bereit ist."
      : original
        ? "Zur 2.5D-Grafik wechseln"
        : "Zur Originalgrafik wechseln";
    this.button.setAttribute("aria-pressed", String(original));
  }
}
