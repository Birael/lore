export default class loreActorBase extends foundry.abstract
  .TypeDataModel {
  static LOCALIZATION_PREFIXES = ["LORE.Actor.base"];

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = {};

    // Actor Level
    schema.level = new fields.SchemaField({
      value: new fields.NumberField({ ...requiredInteger, initial: 1, min: 1 })
    });

    // Characteristics
    schema.characteristics = new fields.ArrayField(new fields.StringField({ initial: '' }), {
      initial: [],
    });

    // Wounds and Fatigue
    schema.wounds = new fields.SchemaField({
      value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, }),
      max: new fields.NumberField({ ...requiredInteger, initial: 3 }),
    });
    schema.fatigue = new fields.SchemaField({
      value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
      max: new fields.NumberField({ ...requiredInteger, initial: 3 }),
    });

    // Combat Conditions
    schema.incapacitated = new fields.BooleanField({ initial: false });
    schema.unconscious = new fields.BooleanField({ initial: false });
    schema.stunned = new fields.BooleanField({ initial: false });

    // Morale
    schema.morale = new fields.NumberField({ ...requiredInteger, initial: 0, min: -6, max: 6 });

    // Derived Statistics
    schema.derivedStatistics = new fields.SchemaField({
      pace: new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 5 }),
      }),
      parry: new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 3 }),
      }),
      resist: new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 4 }),
      })
    });

    // Iterate over attribute names and create a new SchemaField for each.
    schema.attributes = new fields.SchemaField(
      Object.keys(CONFIG.LORE.attributes).reduce((obj, attribute) => {
        obj[attribute] = new fields.SchemaField({
          value: new fields.NumberField({
            ...requiredInteger,
            initial: 1,
            min: 1,
            max: 6
          }),
        });
        return obj;
      }, {})
    );

    // Biography
    schema.biography = new fields.HTMLField();

    return schema;
  }

  prepareDerivedData() {
    // Loop through attribute scores, and add their modifiers to our sheet output.
    for (const key in this.attributes) {
      // Modifier is (value - 1): value 1 => +0, value 2 => +1, etc.
      this.attributes[key].mod = Math.max(0, (this.attributes[key].value ?? 0) - 1);
      // Handle attribute label localization.
      this.attributes[key].label =
        game.i18n.localize(CONFIG.LORE.attributes[key]) ?? key;
    }

    
  }

  getRollData() {
    const data = {};

    // Copy the attribute scores to the top level, so that rolls can use
    // formulas like `@ref.mod + 4`.
    if (this.attributes) {
      for (let [k, v] of Object.entries(this.attributes)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }

    // Level is a top-level field on the DataModel, not nested under attributes
    data.lvl = this.level?.value ?? 0;

    // Morale is a direct numeric field; expose it for roll formulas and morale adjustments
    data.morale = this.morale ?? 0;

    return data;
  }
}
