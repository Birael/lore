/**
 * LoreCoins encapsulates lore coin UI setup and change handling
 * for the Lore actor sheet.
 */
export class LoreCoins {
  /**
   * @param {import('../sheets/actor-sheet.mjs').loreActorSheet} sheet
   */
  constructor(sheet) {
    this.sheet = sheet;
    this._onLoreCoinChangeBound = this._onLoreCoinChange.bind(this);
  }

  /**
   * Attach initialization and change listeners to the current sheet root element.
   * Safe to call on each render.
   * @param {HTMLElement} rootEl
   */
  attach(rootEl) {
    if (!rootEl) return;

    const isCoinActor = this.sheet.document.type === 'Player' || this.sheet.document.type === 'Legend';
    if (!isCoinActor) return;

    const loreCoinValue = Number(this.sheet.actor.system?.loreCoin ?? 0);
    const loreCoinMax = 4;
    const loreCoinBoxes = rootEl.querySelectorAll('input.lore-coin-checkbox');
    for (const cb of loreCoinBoxes) {
      const idx = Math.max(1, Math.min(Number(cb.value) || 0, loreCoinMax));
      cb.checked = idx <= loreCoinValue;
      cb.removeEventListener('change', this._onLoreCoinChangeBound);
      cb.addEventListener('change', this._onLoreCoinChangeBound);
    }
  }

  /**
   * Handle lore coin checkbox change
   * @param {Event} event
   */
  async _onLoreCoinChange(event) {
    event.preventDefault();
    event.stopPropagation();
    const input = event.currentTarget;
    const idx = Math.max(1, Number(input.value) || 1);
    const current = Number(this.sheet.actor.system?.loreCoin ?? 0);
    const max = 8;
    let next = current;
    if (input.checked) next = idx; else next = Math.min(current, idx - 1);
    next = Math.max(0, Math.min(next, max));
    if (next !== current) await this.sheet.actor.update({ 'system.loreCoin': next }, { renderSheet: false });

    // Reflect immediately
    const boxes = this.sheet.element.querySelectorAll('input.lore-coin-checkbox');
    for (const cb of boxes) {
      const v = Math.max(1, Number(cb.value) || 1);
      cb.checked = v <= next;
    }
  }
}
