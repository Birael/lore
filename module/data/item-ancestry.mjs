import loreItemBase from './base-item.mjs';

export default class loreAncestry extends loreItemBase {
  static LOCALIZATION_PREFIXES = [
    'LORE.Item.base',
    'LORE.Item.Ancestry',
  ];

  static defineSchema() {
    const schema = super.defineSchema();
    const fields = foundry.data.fields;

    schema.tag = new fields.StringField({ initial: '' });

    // Size is now a dropdown with fixed options: Tiny, Small, Medium, Large, Huge, Gargantuan
    schema.sizeTag = new fields.StringField({ initial: '' });

    schema.extraTags = new fields.StringField({ initial: '' });

    schema.bioFields = new fields.SchemaField({
      gender: new fields.BooleanField({ initial: true }),
      age: new fields.BooleanField({ initial: true }),
      height: new fields.BooleanField({ initial: true }),
      weight: new fields.BooleanField({ initial: true }),
    });
    
    return schema;
  }

  prepareDerivedData() {
    super.prepareDerivedData();
  }
}
