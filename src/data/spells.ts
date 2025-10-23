import { airTile, earthTile, fireTile, waterTile } from "./tiles.ts";
// import { Option } from "../helpers/chooseWeightedOption.ts";
import { WritableDraft } from "immer";
import { Actions, GameState, Tile } from "../state";
import { addEffectInternal, dealDamageInternal } from "./effects.ts";
import { isEnemy } from "./enemies.ts";
import { sumEffectValue } from "../helpers/effectReaders.ts";

export const rollActiveSpellData = () => {
  const selectedSpell = rollRandomSpell();
  return {
    spell: selectedSpell,
    complete: selectedSpell.requiredTiles.map(() => false),
  };
};

export const rollRandomSpell = () => {
  return spells[Math.floor(Math.random() * spells.length)];
};

export type Spell = {
  name: string;
  description: string;
  requiredTiles: {
    tileName: string;
    tileValue: number | string;
  }[];
  criticalChance: number;
  criticalMultiplier: number;
  manaCost: number;
  targets: "PLAYER" | "ENEMY" | "ENEMIES" | "ALL";
  targetQuantity: number;
  stateUpdater: (
    targets: number[], // indices of enemies, since if it's player we don't need, and ALL is all.
    state: WritableDraft<GameState & Actions>, // FIXME yes I know Actions have no place here but it makes state easier.
    satisfiedDraggedTiles: Tile[],
    spell: Spell, // for context like crit multi/chance
  ) => WritableDraft<GameState & Actions>;
  // spawns: Option[];
};

const rollForCrit = (
  spell: Spell,
  draggedValue: number,
  incCritChance = 1,
  incCritMulti = 1,
) => {
  const { criticalChance, criticalMultiplier } = spell;
  if (criticalChance > 0) {
    const roll = Math.random();
    if (roll < criticalChance * incCritChance) {
      return draggedValue * criticalMultiplier * incCritMulti;
    }
  }
  return draggedValue;
};

const fireballSpell: Spell = {
  name: "Fireball",
  description: "Deal [TILEVALUE] damage to front enemy.",
  requiredTiles: [
    { tileName: fireTile.name, tileValue: "x" },
    { tileName: fireTile.name, tileValue: "2x" },
  ],
  criticalChance: 0.1,
  criticalMultiplier: 2,
  targets: "ENEMY",
  manaCost: 25,
  targetQuantity: -1, // first target, but can't be chosen, so -1
  stateUpdater: (
    _,
    state: WritableDraft<GameState & Actions>,
    tiles,
    spell,
  ) => {
    const targets = Object.values(state.entities)
      .filter(isEnemy)
      .sort((a, b) => a.position - b.position);
    const tileValue = tiles.reduce(
      (total, dTile) => {
        total.total += dTile.value;
        total.critChance += dTile.upgrades.includes("DIAMOND") ? 0.4 : 0;
        return total;
      },
      { total: 0, critChance: 1 },
    );
    console.log("dragged value: ", tileValue);
    dealDamageInternal(
      state,
      targets[0].id,
      rollForCrit(spell, tileValue.total, tileValue.critChance),
    );
    return state;
  },
};

const enflameSpell: Spell = {
  name: "Enflame",
  description: "Apply [TILEVALUE / 4] burn to all enemies for 3 slides.",
  requiredTiles: [
    { tileName: fireTile.name, tileValue: "x" },
    { tileName: fireTile.name, tileValue: "x" },
  ],
  // spawns: [fireTile],
  targets: "ENEMIES",
  criticalChance: 0.1,
  criticalMultiplier: 2,
  manaCost: 15,
  targetQuantity: -1, // doesn't matter, all enemies.
  stateUpdater: (
    _,
    state: WritableDraft<GameState & Actions>,
    tiles,
    spell,
  ) => {
    const targets = Object.values(state.entities).filter(isEnemy);
    const tileValue = tiles.reduce(
      (total, dTile) => {
        total.total += dTile.value;
        total.critChance += dTile.upgrades.includes("DIAMOND") ? 0.4 : 0;
        return total;
      },
      { total: 0, critChance: 1 },
    );
    targets.forEach((target) => {
      addEffectInternal(
        state,
        target.id,
        "Burn",
        {
          amount: rollForCrit(
            spell,
            Math.floor(tileValue.total / 4),
            tileValue.critChance,
          ),
        },
        { durationSlides: 3 },
      );
    });
    return state;
  },
};

const earthBlockSpell: Spell = {
  name: "Earthen Shield",
  description: "Gain [TILEVALUE / 2] block.",
  requiredTiles: [
    { tileName: earthTile.name, tileValue: "x" },
    { tileName: earthTile.name, tileValue: "x" },
  ],
  // spawns: [fireTile],
  targets: "PLAYER",
  criticalChance: 0.1,
  criticalMultiplier: 2,
  manaCost: 15,
  targetQuantity: -1,
  stateUpdater: (
    _,
    state: WritableDraft<GameState & Actions>,
    tiles,
    spell,
  ) => {
    const tileValue = tiles.reduce(
      (total, dTile) => {
        total.total += dTile.value;
        total.critChance += dTile.upgrades.includes("DIAMOND") ? 0.4 : 0;
        return total;
      },
      { total: 0, critChance: 1 },
    );
    addEffectInternal(state, "PLAYER", "Block", {
      amount: rollForCrit(
        spell,
        Math.floor(tileValue.total / 2),
        tileValue.critChance,
      ),
    });
    return state;
  },
};

const earthquakeSpell: Spell = {
  name: "Earthquake",
  description: "Deal [TILEVALUE / 4] + [BLOCK] damage to all enemies.",
  requiredTiles: [
    { tileName: earthTile.name, tileValue: "x" },
    { tileName: earthTile.name, tileValue: "2x" },
  ],
  targets: "ENEMIES",
  criticalChance: 0.1,
  criticalMultiplier: 2,
  manaCost: 20,
  targetQuantity: -1, // all targets.
  stateUpdater: (
    _,
    state: WritableDraft<GameState & Actions>,
    tiles,
    spell,
  ) => {
    const targets = Object.values(state.entities).filter(isEnemy);
    const tileValue = tiles.reduce(
      (total, dTile) => {
        total.total += dTile.value;
        total.critChance += dTile.upgrades.includes("DIAMOND") ? 0.4 : 0;
        return total;
      },
      { total: 0, critChance: 1 },
    );
    const blockValue = sumEffectValue(state, "PLAYER", "Block");
    console.log("dragged value, block value: ", tileValue, blockValue);
    targets.forEach((target) => {
      dealDamageInternal(
        state,
        target.id,
        rollForCrit(
          spell,
          Math.floor(tileValue.total / 4) + blockValue,
          tileValue.critChance,
        ),
      );
    });
    return state;
  },
};

// const waterHealingSpell: Spell = {
//   name: "Vitamin Water",
//   description: "Heals you for [TILEVALUE * 2] health.",
//   requiredTiles: [
//     { tileName: waterTile.name, tileValue: "x" },
//     { tileName: waterTile.name, tileValue: "2x" },
//   ],
//   // spawns: [waterTile],
//   targets: "PLAYER",
//   manaCost: 25,
//   targetQuantity: 0, // shouldn't matter here with PLAYER as target
//   stateUpdater: (_, state: WritableDraft<GameState & Actions>, draggedTiles) => {
//     const draggedValue = draggedTiles.reduce(
//       (total, dTile) => (total += dTile.value),
//       0,
//     );
//     console.log("dragged value: ", draggedValue);
//     // TODO: figure out if healing should be its own effect.
//     dealDamageInternal(state, "PLAYER", -draggedValue);
//     return state;
//   },
// };

const waterDamageSpell: Spell = {
  name: "Water Gun",
  description: "Deals [TILEVALUE - 4] damage to the front enemy",
  requiredTiles: [
    { tileName: waterTile.name, tileValue: "x" },
    { tileName: waterTile.name, tileValue: "2x" },
  ],
  // spawns: [waterTile],
  targets: "ENEMY",
  criticalChance: 0.1,
  criticalMultiplier: 2,
  manaCost: 18,
  targetQuantity: -1, // first target, but can't be chosen, so -1
  stateUpdater: (
    _,
    state: WritableDraft<GameState & Actions>,
    tiles,
    spell,
  ) => {
    const targets = Object.values(state.entities)
      .filter(isEnemy)
      .sort((a, b) => a.position - b.position);
    const tileValue = tiles.reduce(
      (total, dTile) => {
        total.total += dTile.value;
        total.critChance += dTile.upgrades.includes("DIAMOND") ? 0.4 : 0;
        return total;
      },
      { total: 0, critChance: 1 },
    );
    console.log("dragged value: ", tileValue);
    dealDamageInternal(
      state,
      targets[0].id,
      rollForCrit(spell, tileValue.total - 4, tileValue.critChance),
    );
    return state;
  },
};

const waterFreezeSpell: Spell = {
  name: "Freezing Ray",
  description: "Freezes enemies for [TILEVALUE / 4] slides",
  requiredTiles: [
    { tileName: waterTile.name, tileValue: "x" },
    { tileName: waterTile.name, tileValue: "x" },
  ],
  // spawns: [waterTile],
  targets: "ENEMIES",
  criticalChance: 0.1,
  criticalMultiplier: 2,
  manaCost: 14,
  targetQuantity: -1,
  stateUpdater: (
    _,
    state: WritableDraft<GameState & Actions>,
    tiles,
    spell,
  ) => {
    const tileValue = tiles.reduce(
      (total, dTile) => {
        total.total += dTile.value;
        total.critChance += dTile.upgrades.includes("DIAMOND") ? 0.4 : 0;
        return total;
      },
      { total: 0, critChance: 1 },
    );
    const targets = Object.values(state.entities).filter(isEnemy);
    targets.forEach((target) => {
      addEffectInternal(
        state,
        target.id,
        "Freeze",
        {},
        {
          durationSlides: rollForCrit(
            spell,
            Math.floor(tileValue.total / 4),
            tileValue.critChance,
          ),
        },
      );
    });
    return state;
  },
};

const airSwapSpell: Spell = {
  name: "Dance of Air",
  description:
    "Sends the front enemy to the back and deals [TILEVALUE / 3] damage to them",
  requiredTiles: [
    { tileName: airTile.name, tileValue: "x" },
    { tileName: airTile.name, tileValue: "x" },
  ],
  targets: "ENEMY",
  criticalChance: 0.1,
  criticalMultiplier: 2,
  manaCost: 18,
  targetQuantity: -1, // first target, but can't be chosen, so -1
  stateUpdater: (
    _,
    state: WritableDraft<GameState & Actions>,
    tiles,
    spell,
  ) => {
    const targets = Object.values(state.entities)
      .filter(isEnemy)
      .sort((a, b) => a.position - b.position);
    const tileValue = tiles.reduce(
      (total, dTile) => {
        total.total += dTile.value;
        total.critChance += dTile.upgrades.includes("DIAMOND") ? 0.4 : 0;
        return total;
      },
      { total: 0, critChance: 1 },
    );
    console.log("targets ", targets);
    dealDamageInternal(
      state,
      targets[0].id,
      rollForCrit(spell, Math.floor(tileValue.total / 3), tileValue.critChance),
    );
    if (targets.length > 1) {
      const frontEnemy = targets[0];
      const lastEnemy = targets[targets.length - 1];
      frontEnemy.position = lastEnemy.position + 1;
    }
    return state;
  },
};

const airDamageSpell: Spell = {
  name: "Wind Blast",
  description: "Apply [TILEVALUE / 2] damage to all enemies.",
  requiredTiles: [
    { tileName: airTile.name, tileValue: "x" },
    { tileName: airTile.name, tileValue: "2x" },
  ],
  targets: "ENEMIES",
  criticalChance: 0.1,
  criticalMultiplier: 2,
  manaCost: 15,
  targetQuantity: -1, // doesn't matter, all enemies.
  stateUpdater: (
    _,
    state: WritableDraft<GameState & Actions>,
    tiles,
    spell,
  ) => {
    const targets = Object.values(state.entities).filter(isEnemy);
    const tileValue = tiles.reduce(
      (total, dTile) => {
        total.total += dTile.value;
        total.critChance += dTile.upgrades.includes("DIAMOND") ? 0.4 : 0;
        return total;
      },
      { total: 0, critChance: 1 },
    );
    targets.forEach((target) => {
      dealDamageInternal(
        state,
        target.id,
        rollForCrit(spell, tileValue.total / 2, tileValue.critChance),
      );
    });
    return state;
  },
};

export const spells = [
  fireballSpell,
  enflameSpell,
  earthBlockSpell,
  earthquakeSpell,
  waterFreezeSpell,
  waterDamageSpell,
  airDamageSpell,
  airSwapSpell,
];
