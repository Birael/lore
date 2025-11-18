export const LORE = {};

/**
 * The set of Attribute Scores used within the system.
 * @type {Object}
 */
LORE.attributes = {
  ref: 'LORE.Attribute.Ref.long',
  int: 'LORE.Attribute.Int.long',
  gri: 'LORE.Attribute.Gri.long',
  mig: 'LORE.Attribute.Mig.long',
  tou: 'LORE.Attribute.Tou.long',
  pre: 'LORE.Attribute.Pre.long',
};

LORE.attributeAbbreviations = {
  ref: 'LORE.Attribute.Ref.abbr',
  int: 'LORE.Attribute.Int.abbr',
  gri: 'LORE.Attribute.Gri.abbr',
  mig: 'LORE.Attribute.Mig.abbr',
  tou: 'LORE.Attribute.Tou.abbr',
  pre: 'LORE.Attribute.Pre.abbr',
};

/**
 * The type of each attribute: 'physical' or 'mental'.
 * @type {Object}
 */
LORE.attributeTypes = {
  ref: 'physical',
  int: 'mental',
  gri: 'mental',
  mig: 'physical',
  tou: 'physical',
  pre: 'mental',
};

/**
 * Weapon type options
 */
LORE.weaponTypes = {
  melee: 'LORE.Item.Weapon.Types.melee',
  ranged: 'LORE.Item.Weapon.Types.ranged',
};