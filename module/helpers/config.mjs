export const LORE = {};

/**
 * The set of Attribute Scores used within the system.
 * @type {Object}
 */
LORE.attributes = {
  ref: 'LORE.Actor.Attribute.Ref.long',
  int: 'LORE.Actor.Attribute.Int.long',
  gri: 'LORE.Actor.Attribute.Gri.long',
  mig: 'LORE.Actor.Attribute.Mig.long',
  tou: 'LORE.Actor.Attribute.Tou.long',
  cha: 'LORE.Actor.Attribute.Cha.long',
};

LORE.attributeAbbreviations = {
  ref: 'LORE.Actor.Attribute.Ref.abbr',
  int: 'LORE.Actor.Attribute.Int.abbr',
  gri: 'LORE.Actor.Attribute.Gri.abbr',
  mig: 'LORE.Actor.Attribute.Mig.abbr',
  tou: 'LORE.Actor.Attribute.Tou.abbr',
  cha: 'LORE.Actor.Attribute.Cha.abbr',
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
  phy: 'physical',
  cha: 'mental',
};

/**
 * Weapon type options
 */
LORE.weaponTypes = {
  melee: 'LORE.Item.Weapon.Types.melee',
  ranged: 'LORE.Item.Weapon.Types.ranged',
};