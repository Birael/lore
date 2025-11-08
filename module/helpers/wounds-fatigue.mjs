/**
 * LoreWoundsFatigue encapsulates wounds and fatigue UI setup and change handling
 * for the Lore actor sheet.
 */
export class LoreWoundsFatigue {
  /**
   * @param {import('../sheets/actor-sheet.mjs').loreActorSheet} sheet
   */
  constructor(sheet) {
    this.sheet = sheet;

    // Stable bound handlers to allow proper removeEventListener during re-renders
    this._onWoundsChangeBound = this._onWoundsChange.bind(this);
    this._onFatigueChangeBound = this._onFatigueChange.bind(this);
    // Conditions
    this._onUnconsciousChangeBound = this._onUnconsciousChange.bind(this);
    this._onIncapacitatedChangeBound = this._onIncapacitatedChange.bind(this);
    this._onStunnedChangeBound = this._onStunnedChange.bind(this);
  }

  /**
   * Attach initialization and change listeners to the current sheet root element.
   * Safe to call on each render.
   * @param {HTMLElement} rootEl
   */
  attach(rootEl) {
    if (!rootEl) return;

    // Wounds
    const woundsValue = Number(this.sheet.actor.system?.wounds?.value ?? 0);
    const woundsMax = Number(this.sheet.actor.system?.wounds?.max ?? 3);
    const woundBoxes = rootEl.querySelectorAll('input.wounds-checkbox');
    for (const cb of woundBoxes) {
      const idx = Math.max(1, Math.min(Number(cb.value) || 0, woundsMax));
      cb.checked = idx <= woundsValue;
      cb.removeEventListener('change', this._onWoundsChangeBound);
      cb.addEventListener('change', this._onWoundsChangeBound);
    }

    // Fatigue
    const fatigueValue = Number(this.sheet.actor.system?.fatigue?.value ?? 0);
    const fatigueMax = Number(this.sheet.actor.system?.fatigue?.max ?? 3);
    const fatigueBoxes = rootEl.querySelectorAll('input.fatigue-checkbox');
    for (const cb of fatigueBoxes) {
      const idx = Math.max(1, Math.min(Number(cb.value) || 0, fatigueMax));
      cb.checked = idx <= fatigueValue;
      cb.removeEventListener('change', this._onFatigueChangeBound);
      cb.addEventListener('change', this._onFatigueChangeBound);
    }

    // Conditions: reflect current actor state and bind changes
    try {
      const isUnconscious = !!this.sheet.actor.system?.unconscious;
      const isIncapacitated = !!this.sheet.actor.system?.incapacitated;
      const isStunned = !!this.sheet.actor.system?.stunned;

      const uncBoxes = rootEl.querySelectorAll('input.unconscious-checkbox');
      for (const cb of uncBoxes) {
        cb.checked = isUnconscious;
        cb.removeEventListener('change', this._onUnconsciousChangeBound);
        cb.addEventListener('change', this._onUnconsciousChangeBound);
      }

      const incBoxes = rootEl.querySelectorAll('input.incapacitated-checkbox');
      for (const cb of incBoxes) {
        cb.checked = isIncapacitated;
        cb.removeEventListener('change', this._onIncapacitatedChangeBound);
        cb.addEventListener('change', this._onIncapacitatedChangeBound);
      }

      const stunBoxes = rootEl.querySelectorAll('input.stunned-checkbox');
      for (const cb of stunBoxes) {
        cb.checked = isStunned;
        cb.removeEventListener('change', this._onStunnedChangeBound);
        cb.addEventListener('change', this._onStunnedChangeBound);
      }
    } catch (e) {
      console.warn('LORE | Failed to bind condition checkboxes', e);
    }
  }

  /**
   * Handle wounds checkbox change
   * @param {Event} event
   */
  async _onWoundsChange(event) {
    event.preventDefault();
    event.stopPropagation();
    const input = event.currentTarget;
    const idx = Math.max(1, Number(input.value) || 1);
    const current = Number(this.sheet.actor.system?.wounds?.value ?? 0);
    const max = Number(this.sheet.actor.system?.wounds?.max ?? 3);
    let next = current;
    if (input.checked) next = idx; else next = Math.min(current, idx - 1);
    next = Math.max(0, Math.min(next, max));
  if (next !== current) await this.sheet.actor.update({ 'system.wounds.value': next }, { renderSheet: false });

    // If wounds reach 3, set unconscious to true (do not unset if below 3)
    if (next === 3 && !this.sheet.actor.system?.unconscious) {
      await this.sheet.actor.update({ 'system.unconscious': true }, { renderSheet: false });
    }

    // Reflect immediately
    const boxes = this.sheet.element.querySelectorAll('input.wounds-checkbox');
    for (const cb of boxes) {
      const v = Math.max(1, Number(cb.value) || 1);
      cb.checked = v <= next;
    }
  }

  /**
   * Handle fatigue checkbox change
   * @param {Event} event
   */
  async _onFatigueChange(event) {
    event.preventDefault();
    event.stopPropagation();
    const input = event.currentTarget;
    const idx = Math.max(1, Number(input.value) || 1);
    const current = Number(this.sheet.actor.system?.fatigue?.value ?? 0);
    const max = Number(this.sheet.actor.system?.fatigue?.max ?? 3);
    let next = current;
    if (input.checked) next = idx; else next = Math.min(current, idx - 1);
    next = Math.max(0, Math.min(next, max));
  if (next !== current) await this.sheet.actor.update({ 'system.fatigue.value': next }, { renderSheet: false });

    // If fatigue reaches 3, set incapacitated to true (do not unset if below 3)
    if (next === 3 && !this.sheet.actor.system?.incapacitated) {
      await this.sheet.actor.update({ 'system.incapacitated': true }, { renderSheet: false });
    }

    // Reflect immediately
    const boxes = this.sheet.element.querySelectorAll('input.fatigue-checkbox');
    for (const cb of boxes) {
      const v = Math.max(1, Number(cb.value) || 1);
      cb.checked = v <= next;
    }
  }

  /**
   * Handle unconscious checkbox change
   * @param {Event} event
   */
  async _onUnconsciousChange(event) {
    event.preventDefault();
    event.stopPropagation();
    const input = event.currentTarget;
    try {
      const current = !!this.sheet.actor.system?.unconscious;
      const next = !!input.checked;
  if (next !== current) await this.sheet.actor.update({ 'system.unconscious': next }, { renderSheet: false });

      // Reflect immediately
      const boxes = this.sheet.element.querySelectorAll('input.unconscious-checkbox');
      for (const cb of boxes) cb.checked = next;
    } catch (e) {
      console.warn('LORE | Failed to toggle unconscious', e);
    }
  }

  /**
   * Handle incapacitated checkbox change
   * @param {Event} event
   */
  async _onIncapacitatedChange(event) {
    event.preventDefault();
    event.stopPropagation();
    const input = event.currentTarget;
    try {
      const current = !!this.sheet.actor.system?.incapacitated;
      const next = !!input.checked;
  if (next !== current) await this.sheet.actor.update({ 'system.incapacitated': next }, { renderSheet: false });

      // Reflect immediately
      const boxes = this.sheet.element.querySelectorAll('input.incapacitated-checkbox');
      for (const cb of boxes) cb.checked = next;
    } catch (e) {
      console.warn('LORE | Failed to toggle incapacitated', e);
    }
  }

  /**
   * Handle stunned checkbox change
   * @param {Event} event
   */
  async _onStunnedChange(event) {
    event.preventDefault();
    event.stopPropagation();
    const input = event.currentTarget;
    try {
      const current = !!this.sheet.actor.system?.stunned;
      const next = !!input.checked;
  if (next !== current) await this.sheet.actor.update({ 'system.stunned': next }, { renderSheet: false });

      // Reflect immediately
      const boxes = this.sheet.element.querySelectorAll('input.stunned-checkbox');
      for (const cb of boxes) cb.checked = next;
    } catch (e) {
      console.warn('LORE | Failed to toggle stunned', e);
    }
  }
}
