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
    /**
     * Cached image path for lore coin sprite
     * Using systems/ path so it works from any user data location
     * @type {string}
     */
  // Note: ensure no double slashes in the path; Foundry expects exact file paths
  // Primary image path requested by user
  this.coinImagePath = 'systems/lore/assets/icons/LoreCoin.svg';
    /** @type {HTMLElement|null} */
    this._coinBtnEl = null;
    /** @type {MutationObserver|null} */
    this._coinObserver = null;
  }

  /**
   * Attach initialization and change listeners to the current sheet root element.
   * Safe to call on each render.
   * @param {HTMLElement} rootEl
   */
  attach(rootEl) {
    if (!rootEl) return;

    // Ensure a sheet-scoped adjust listener (was previously global, which caused all open sheets to react)
    if (!this._loreCoinAdjustHandler) {
      this._loreCoinAdjustHandler = async (event) => {
        const delta = event.detail?.delta || 0;
        if (!delta) return;
        await this._adjustCoins(delta);
      };
    }
    // Bind only to the sheet root, not window, to prevent cross-actor coin syncing
    rootEl.removeEventListener('loreCoinAdjust', this._loreCoinAdjustHandler);
    rootEl.addEventListener('loreCoinAdjust', this._loreCoinAdjustHandler);

    // Normalize root element
    const root = rootEl?.jquery ? rootEl[0] : rootEl;

    // Attempt to find the coin button immediately
    let coinBtn = root?.querySelector?.('.lore-coin-clickable-space');
    if (!coinBtn) coinBtn = root?.querySelector?.('[aria-label="Lore Coin Area"]');

    if (!coinBtn) {
      console.log('LORE | LoreCoins.attach: coin button not found, observing for insertion...');
      // Setup a one-time MutationObserver to catch late insertion
      if (this._coinObserver) {
        try { this._coinObserver.disconnect(); } catch {}
      }
      this._coinObserver = new MutationObserver(() => {
        const found = root?.querySelector?.('.lore-coin-clickable-space') || root?.querySelector?.('[aria-label="Lore Coin Area"]');
        if (found) {
          try { this._coinObserver.disconnect(); } catch {}
          this._coinObserver = null;
          this._bindCoinButton(found);
        }
      });
      try {
        this._coinObserver.observe(root, { childList: true, subtree: true });
      } catch (e) {
        console.warn('LORE | LoreCoins.attach: failed to observe DOM for coin button', e);
      }
      return;
    }

    // Found immediately, bind now
    this._bindCoinButton(coinBtn);

    const loreCoinValue = Number(this.sheet.actor.system?.loreCoin ?? 0);
  // Debug: log initial coin value on attach
    console.log('LORE | LoreCoins.attach coin value =', loreCoinValue, 'actor', this.sheet.actor?.name);
  const loreCoinBoxes = rootEl.querySelectorAll('input.lore-coin-checkbox');
    for (const cb of loreCoinBoxes) {
      const idx = Math.max(1, Number(cb.value) || 0);
      cb.checked = idx <= loreCoinValue;
      cb.removeEventListener('change', this._onLoreCoinChangeBound);
      cb.addEventListener('change', this._onLoreCoinChangeBound);
    }

  // Visual cue to confirm binding occurred
  try { this._coinBtnEl.style.outline = '2px solid #daa520'; setTimeout(() => { this._coinBtnEl && (this._coinBtnEl.style.outline = ''); }, 600); } catch {}
  // Render coin sprites into the clickable space
  this._updateCoinUI(loreCoinValue);
  }

  /**
   * Bind handlers to the coin button and remember the element
   * @param {HTMLElement} btn
   * @private
   */
  _bindCoinButton(btn) {
    this._coinBtnEl = btn;
    if (!this._coinBtnClickHandler) {
      this._coinBtnClickHandler = async (e) => {
        e.preventDefault(); e.stopPropagation();
        await this._adjustCoins(-1);
      };
    }
    if (!this._coinBtnContextHandler) {
      this._coinBtnContextHandler = async (e) => {
        e.preventDefault(); e.stopPropagation();
        await this._adjustCoins(1);
      };
    }
    btn.removeEventListener('click', this._coinBtnClickHandler);
    btn.removeEventListener('contextmenu', this._coinBtnContextHandler);
    btn.addEventListener('click', this._coinBtnClickHandler);
    btn.addEventListener('contextmenu', this._coinBtnContextHandler);
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
    let next = current;
    if (input.checked) next = idx; else next = Math.min(current, idx - 1);
    next = Math.max(0, next);
    if (next !== current) await this.sheet.actor.update({ 'system.loreCoin': next }, { renderSheet: false });

    // Reflect immediately
    const boxes = this.sheet.element.querySelectorAll('input.lore-coin-checkbox');
    for (const cb of boxes) {
      const v = Math.max(1, Number(cb.value) || 1);
      cb.checked = v <= next;
    }

    // Update sprites and label
    this._updateCoinUI(next);
  }

  /**
   * Adjust coins by a delta and refresh UI
   * @param {number} delta
   * @private
   */
  async _adjustCoins(delta) {
    try {
      const current = Math.max(0, Number(this.sheet.actor.system?.loreCoin ?? 0));
      let next = Math.max(0, current + Number(delta || 0));
      if (next === current) return;
      await this.sheet.actor.update({ 'system.loreCoin': next }, { renderSheet: false });
      // Reflect immediately for any legacy checkboxes
      const boxes = this.sheet.element.querySelectorAll('input.lore-coin-checkbox');
      for (const cb of boxes) {
        const v = Math.max(1, Number(cb.value) || 1);
        cb.checked = v <= next;
      }
  console.log('LORE | _adjustCoins updated value =', next);
      this._updateCoinUI(next);
    } catch (err) {
      console.warn('LORE | Failed adjusting coins', err);
    }
  }

  /**
   * Update the visible UI for coins: the label content and the sprites inside the clickable space
   * @param {number} count
   * @private
   */
  _updateCoinUI(count) {
    try {
  console.log('LORE | _updateCoinUI rendering count =', count);
      // Update label number, preserving localized label prefix
      const label = this.sheet.element[0]?.querySelector?.('.lore-coins-label') ?? this.sheet.element.querySelector?.('.lore-coins-label');
      if (label && typeof label.textContent === 'string') {
        const parts = String(label.textContent).split(':');
        if (parts.length > 1) label.textContent = `${parts[0]}: ${count}`;
        else label.textContent = `${label.textContent} ${count}`;
      }

      // Update sprites
  const btn = this._coinBtnEl || (this.sheet.element[0] ?? this.sheet.element)?.querySelector?.('.lore-coin-clickable-space');
  if (!btn) return;
  this._renderCoinSprites(btn, count);
    } catch (err) {
      console.warn('LORE | Failed to update coin UI', err);
    }
  }

  /**
   * Render coin sprites inside a container/button at random positions
   * @param {HTMLElement} container The clickable space element
   * @param {number} count Number of coins to render
   * @private
   */
  _renderCoinSprites(container, count) {
    if (!container) return;
    // Clear any existing sprites
    container.querySelectorAll('img.lore-coin-sprite').forEach((el) => el.remove());
    container.querySelectorAll('.lore-coin-placeholder').forEach((el) => el.remove());

    // Ensure the container can position children
    container.classList.add('has-lore-coins');

    const maxCoins = Math.max(0, Number(count) || 0);
    if (maxCoins === 0) {
      // Provide visible feedback that there are zero coins
      const zeroEl = document.createElement('div');
      zeroEl.className = 'lore-coin-placeholder';
      zeroEl.textContent = '0';
      zeroEl.style.position = 'absolute';
      zeroEl.style.inset = '0';
      zeroEl.style.display = 'flex';
      zeroEl.style.alignItems = 'center';
      zeroEl.style.justifyContent = 'center';
      zeroEl.style.fontSize = '24px';
      zeroEl.style.color = '#daa520';
      zeroEl.style.opacity = '0.35';
      zeroEl.style.pointerEvents = 'none';
      container.appendChild(zeroEl);
      return;
    }

    // Measure available size
    let w = container.clientWidth || 120;
    let h = container.clientHeight || 60;

    // If initial layout not settled (very small), schedule a retry after next frame
    if (w < 30 || h < 30) {
  console.log('LORE | Coin container too small initially (', w, 'x', h, ') deferring render');
      requestAnimationFrame(() => this._renderCoinSprites(container, count));
      return;
    }
    // Coin size relative to container height
    const coinSize = Math.max(12, Math.min(28, Math.floor(h * 0.35)));

    // Create a deterministic RNG based on actor id and current count so layout
    // stays the same across sheet renders and only changes when the coin value changes
    const seedBase = this._hashStringToInt(this.sheet.actor?.id || 'unknown');
    const rng = this._mulberry32((seedBase ^ (count | 0) ^ 0x9e3779b9) >>> 0);
    // Helper to get a random int in [min, max] using the deterministic RNG
    const randInt = (min, max) => {
      if (max < min) return min; // guard for zero-size container edge cases
      const r = rng();
      return Math.floor(r * (max - min + 1)) + min;
    };

    for (let i = 0; i < maxCoins; i++) {
      const img = document.createElement('img');
      img.src = this.coinImagePath;
      img.alt = 'Lore Coin';
      img.className = 'lore-coin-sprite';
      img.width = coinSize;
      img.height = coinSize;
      img.draggable = false;
      // Fallback chain if the custom sprite is missing
      img.addEventListener('error', () => {
        img.removeEventListener('error', this);
        // Try legacy subfolder location first
        if (!img.dataset._fallbackTried) {
          img.dataset._fallbackTried = '1';
          img.src = 'systems/lore/assets/icons/lore/LoreCoin.svg';
        } else {
          img.src = 'icons/svg/coins.svg';
        }
      }, { once: true });
      // Random position within container bounds, leaving margin so coins don't clip
      const margin = Math.max(2, Math.floor(coinSize * 0.2));
  const maxLeft = Math.max(0, w - coinSize - margin);
  const maxTop = Math.max(0, h - coinSize - margin);
      const left = randInt(margin, maxLeft);
      const top = randInt(margin, maxTop);
      const rot = randInt(-20, 20);
      img.style.position = 'absolute';
      img.style.left = `${left}px`;
      img.style.top = `${top}px`;
      img.style.transform = `rotate(${rot}deg)`;
      img.style.opacity = '0.95';
      img.style.pointerEvents = 'none';
      container.appendChild(img);
    }
    // If after a tick all coin images failed (e.g., wrong path), add a textual placeholder so user sees something
    setTimeout(() => {
      const imgs = container.querySelectorAll('img.lore-coin-sprite');
      if (imgs.length === 0) {
        const warn = document.createElement('div');
        warn.className = 'lore-coin-placeholder';
        warn.textContent = String(maxCoins);
        warn.style.position = 'absolute';
        warn.style.inset = '0';
        warn.style.display = 'flex';
        warn.style.alignItems = 'center';
        warn.style.justifyContent = 'center';
        warn.style.fontSize = '28px';
        warn.style.color = '#ffdd55';
        warn.style.textShadow = '0 0 6px #000';
        warn.style.pointerEvents = 'none';
        container.appendChild(warn);
        console.warn('LORE | Coin images failed to render, showing numeric placeholder instead. Check path:', this.coinImagePath);
      }
    }, 150);

    // Attach data attribute for quick dev tooling inspection
    container.dataset.coinCount = String(maxCoins);
  }

  /**
   * Deterministic pseudo-random number generator (Mulberry32)
   * @param {number} a Unsigned 32-bit seed
   * @returns {() => number} Function returning a float in [0,1)
   * @private
   */
  _mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * Simple 32-bit hash of a string
   * @param {string} str
   * @returns {number} Unsigned 32-bit integer
   * @private
   */
  _hashStringToInt(str) {
    let h = 2166136261 >>> 0; // FNV-1a basis
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /**
   * Optional cleanup if the sheet is being destroyed; call from sheet close if needed.
   */
  destroy() {
    try {
      const root = this.sheet.element?.jquery ? this.sheet.element[0] : this.sheet.element;
      if (root && this._loreCoinAdjustHandler) {
        root.removeEventListener('loreCoinAdjust', this._loreCoinAdjustHandler);
      }
      if (this._coinObserver) {
        this._coinObserver.disconnect();
        this._coinObserver = null;
      }
    } catch (e) {
      console.warn('LORE | LoreCoins.destroy failed', e);
    }
  }
}
