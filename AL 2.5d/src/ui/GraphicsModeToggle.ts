import type { GraphicsMode } from "../legacy/LegacyCompatibilityRuntime";

export class GraphicsModeToggle {
  private readonly button: HTMLButtonElement;
  private mode: GraphicsMode = "2.5d";

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

  destroy(): void {
    this.button.remove();
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
