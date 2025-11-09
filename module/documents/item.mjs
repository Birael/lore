/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class loreItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
  }

  /**
   * Prepare a data object which defines the data schema used by dice roll commands against this Item
   * @override
   */
  getRollData() {
    // Starts off by populating the roll data with a shallow copy of `this.system`
    const rollData = { ...this.system };

    // Quit early if there's no parent actor
    if (!this.actor) return rollData;

    // If present, add the actor's roll data
    rollData.actor = this.actor.getRollData();

    return rollData;
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll(event) {
    const item = this;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `[${item.type}] ${item.name}`;

    // If there's no roll data, send a chat message.
    if (!this.system.formula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.system.description ?? '',
      });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data.
      const rollData = this.getRollData();

      // Append actor morale at end of formula if present; ensure explicit sign and parentheses.
      const morale = this.actor?.system?.morale ?? 0;
      const buildMoraleFormula = (formula, moraleVal) => {
        if (!Number.isFinite(moraleVal) || moraleVal === 0) return formula; // No change
        const sign = moraleVal >= 0 ? '+' : '-';
        return `(${formula}) ${sign} ${Math.abs(moraleVal)}`;
      };
      const finalFormula = buildMoraleFormula(rollData.formula, morale);

      // Invoke the roll (morale applied) and submit it to chat.
      const roll = new Roll(finalFormula, rollData.actor);
      // If you need to store the value first, uncomment the next line.
      // const result = await roll.evaluate();
      const moraleFlavor = morale ? ` (Morale ${morale >= 0 ? '+' : ''}${morale})` : '';
      roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: `${label}${moraleFlavor}`,
      });
      return roll;
    }
  }
}
