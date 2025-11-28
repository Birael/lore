import loreItemBase from './base-item.mjs';

export default class loreSkill extends loreItemBase {
    /**
     * Always fetch the current total modifier from the actor's attribute and skill modifier.
     */
    get currentTotalModifier() {
        // In a DataModel on an Item, parent is the Item; parent.parent is the Actor
        const actor = this.parent?.parent;
      let attributeMod = 0;
        const tiedAttr = this.tiedAttribute || 'ref';
        if (actor && actor.system?.attributes && tiedAttr in actor.system.attributes) {
          const attr = actor.system.attributes[tiedAttr];
        attributeMod = typeof attr.mod === 'number' ? attr.mod : Number(attr.mod ?? 0);
      }
      let skillMod = Number(this.modifier ?? 0);
      if (this.untrained) skillMod = -3;
      return skillMod + attributeMod;
    }
  static LOCALIZATION_PREFIXES = [
    'LORE.Item.base',
    'LORE.Item.Skill',
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.rank = new fields.SchemaField({
      value: new fields.NumberField({ ...requiredInteger, initial: 1, min: 1 }),
      max: new fields.NumberField({ ...requiredInteger, initial: 5 }),
    });

    // Add tiedAttribute field, choices from LORE.attributeTypes keys
    schema.tiedAttribute = new fields.StringField({
      required: true,
      initial: 'ref', // default to first attribute, adjust as needed
      choices: Object.keys(CONFIG.LORE?.attributeTypes ?? { ref: '', int: '', gri: '', mig: '', phy: '', cha: '' })
    });

    // Flat modifier applied to this skill's rolls (can be negative)
    schema.modifier = new fields.NumberField({
      required: true,
      nullable: false,
      integer: true,
      initial: 0,
      min: -999,
      step: 1,
    });

    // Untrained skill checkbox
    schema.untrained = new fields.BooleanField({
      required: true,
      initial: false,
    });

      // Brawling skill checkbox
      schema.brawling = new fields.BooleanField({
        required: true,
        initial: false,
      });

    return schema;
  }

  prepareDerivedData() {
    super.prepareDerivedData();

    // this.parent should be the Item's parent (the Actor)
    const actor = this.parent?.parent;
    if (!actor) return 0;
    // Defensive: check if attributes exist and have the tied attribute
    let attributeMod = 0;
    const tiedAttr = this.tiedAttribute || 'ref';
    if (actor.system?.attributes && tiedAttr in actor.system.attributes) {
      const attr = actor.system.attributes[tiedAttr];
      attributeMod = typeof attr.mod === 'number' ? attr.mod : Number(attr.mod ?? 0);
    } else {
      console.warn(`LORE | Skill '${this.name}' could not find tied attribute '${this.tiedAttribute}' on actor '${actor.name}'.`);
    }

    let diceNum = Number(this.rank?.value ?? 1);
    let skillMod = Number(this.modifier ?? 0);

    // If untrained, override certain properties
    if (this.untrained) {
      this.rank.value = 1;
      skillMod = -3;
      // Untrained skills ignore attribute modifiers, so do not use attr
      this.totalModifier = skillMod;
      // Base formula contains only dice+keep/explode flags; flat mods are applied by the roll handler
      this.formula = `1d6khx`;
    } else {
      // Add attribute modifier to skill modifier
      const total = skillMod + attributeMod;
      this.totalModifier = total;
      // Base formula contains only dice+keep/explode flags; flat mods are applied by the roll handler
      this.formula = `${diceNum}d6khx`;
    }
  }
}
