// Import document classes.
import { loreActor } from './documents/actor.mjs';
import { loreItem } from './documents/item.mjs';
// Import sheet classes.
import { loreActorSheet } from './sheets/actor-sheet.mjs';
import { loreItemSheet } from './sheets/item-sheet.mjs';
// Import helper/utility classes and constants.
import { LORE } from './helpers/config.mjs';
// Import DataModel classes
import * as models from './data/_module.mjs';

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

// Add key classes to the global scope so they can be more easily used
// by downstream developers
globalThis.lore = {
  documents: {
    loreActor,
    loreItem,
  },
  applications: {
    loreActorSheet,
    loreItemSheet,
  },
  utils: {
    rollItemMacro,
  },
  models,
};

Hooks.once('init', function () {
  // Add custom constants for configuration.
  CONFIG.LORE = LORE;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: '2d6 + @ref.mod',
    decimals: 2,
  };

  // Define custom Document and DataModel classes
  CONFIG.Actor.documentClass = loreActor;

  // Note that you don't need to declare a DataModel
  // for the base actor/item classes - they are included
  // with the Player/Legend/Lackey as part of super.defineSchema()
  CONFIG.Actor.dataModels = {
    // Keys must match the Actor document type names defined in system.json
    // Your system uses capitalized types: "Player", "Legend", "Lackey"
    Player: models.lorePlayer,
    Legend: models.loreLegend,
    Lackey: models.loreLackey,
  };
  CONFIG.Item.documentClass = loreItem;
  CONFIG.Item.dataModels = {
    gear: models.loreGear,
    skill: models.loreSkill,
  };

  // Active Effects are never copied to the Actor,
  // but will still apply to the Actor from within the Item
  // if the transfer property on the Active Effect is true.
  CONFIG.ActiveEffect.legacyTransferral = false;

  // Register sheet application classes
  foundry.documents.collections.Actors.unregisterSheet('core', foundry.appv1.sheets.ActorSheet);
  foundry.documents.collections.Actors.registerSheet('lore', loreActorSheet, {
    makeDefault: true,
    label: 'LORE.SheetLabels.Actor',
  });
  foundry.documents.collections.Items.unregisterSheet('core', foundry.appv1.sheets.ItemSheet);
  foundry.documents.collections.Items.registerSheet('lore', loreItemSheet, {
    makeDefault: true,
    label: 'LORE.SheetLabels.Item',
  });
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here is a useful example:
Handlebars.registerHelper('toLowerCase', function (str) {
  return str.toLowerCase();
});

/**
 * Handlebars helper: range
 * Generate an inclusive array of numbers suitable for iteration in templates.
 * Usages:
 *  - {{#each (range 1 5)}} ... {{/each}}          -> [1,2,3,4,5]
 *  - {{#each (range 5)}} ... {{/each}}            -> [1,2,3,4,5]
 *  - {{#each (range 0 10 2)}} ... {{/each}}       -> [0,2,4,6,8,10]
 *  - {{#each (range 5 1)}} ... {{/each}}          -> [5,4,3,2,1]
 * Notes:
 *  - Start and end are inclusive.
 *  - Step defaults to 1 and its sign is inferred from start/end ordering.
 */
Handlebars.registerHelper('range', function (...args) {
  // Last arg is Handlebars options hash; we don't use it but must remove it.
  const options = args.pop();
  const toNum = (v) => (typeof v === 'number' ? v : Number(v));

  let start, end, step = 1;
  if (args.length === 1) {
    end = toNum(args[0]);
    start = 1;
  } else {
    start = toNum(args[0]);
    end = toNum(args[1]);
    if (args[2] !== undefined) step = toNum(args[2]);
  }

  // Validate numbers
  if (!Number.isFinite(start)) start = 0;
  if (!Number.isFinite(end)) end = 0;
  if (!Number.isFinite(step) || step === 0) step = 1;

  // Normalize step direction based on range direction
  const ascending = end >= start;
  step = Math.abs(step) * (ascending ? 1 : -1);

  const out = [];
  if (ascending) {
    for (let i = start; i <= end; i += step) out.push(i);
  } else {
    for (let i = start; i >= end; i += step) out.push(i);
  }
  return out;
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on('hotbarDrop', (bar, data, slot) => createDocMacro(data, slot));
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createDocMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== 'Item') return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn(
      'You can only create macro buttons for owned Items'
    );
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.lore.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(
    (m) => m.name === item.name && m.command === command
  );
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: 'script',
      img: item.img,
      command: command,
      flags: { 'lore.itemMacro': true },
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: 'Item',
    uuid: itemUuid,
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then((item) => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(
        `Could not find item ${itemName}. You may need to delete and recreate this macro.`
      );
    }

    // Trigger the item roll
    item.roll();
  });
}
