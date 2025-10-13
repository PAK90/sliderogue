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
  manaCost: number;
  targets: "PLAYER" | "ENEMY" | "ENEMIES" | "ALL";
  targetQuantity: number;
  stateUpdater: (
    targets: number[], // indices of enemies, since if it's player we don't need, and ALL is all.
    state: WritableDraft<GameState & Actions>, // FIXME yes I know Actions have no place here but it makes state easier.
    satisfiedDraggedTiles: Tile[],
  ) => WritableDraft<GameState & Actions>;
  // spawns: Option[];
};

const fireballSpell: Spell = {
  name: "Fireball",
  description: "Deal [TILEVALUE] damage to front enemy.",
  requiredTiles: [
    { tileName: fireTile.name, tileValue: "x" },
    { tileName: fireTile.name, tileValue: "2x" },
  ],
  // spawns: [fireTile],
  targets: "ENEMY",
  manaCost: 25,
  targetQuantity: -1, // first target, but can't be chosen, so -1
  stateUpdater: (
    _,
    state: WritableDraft<GameState & Actions>,
    draggedTiles,
  ) => {
    const targets = Object.values(state.entities)
      .filter(isEnemy)
      .sort((a, b) => a.position - b.position);
    const draggedValue = draggedTiles.reduce(
      (total, dTile) => (total += dTile.value),
      0,
    );
    console.log("dragged value: ", draggedValue);
    dealDamageInternal(state, targets[0].id, draggedValue);
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
  manaCost: 15,
  targetQuantity: -1, // doesn't matter, all enemies.
  stateUpdater: (_, state: WritableDraft<GameState & Actions>, tiles) => {
    const targets = Object.values(state.entities).filter(isEnemy);
    const tileValue = tiles.reduce((total, dTile) => (total += dTile.value), 0);
    targets.forEach((target) => {
      addEffectInternal(
        state,
        target.id,
        "Burn",
        {
          amount: Math.floor(tileValue / 4),
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
  manaCost: 15,
  targetQuantity: -1,
  stateUpdater: (_, state: WritableDraft<GameState & Actions>, tiles) => {
    // const { addEffect } = state;
    const tileValue = tiles.reduce((total, dTile) => (total += dTile.value), 0);
    addEffectInternal(state, "PLAYER", "Block", {
      amount: Math.floor(tileValue / 2),
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
  manaCost: 20,
  targetQuantity: -1, // all targets.
  stateUpdater: (
    _,
    state: WritableDraft<GameState & Actions>,
    draggedTiles,
  ) => {
    const targets = Object.values(state.entities).filter(isEnemy);
    const draggedValue = draggedTiles.reduce(
      (total, dTile) => (total += dTile.value),
      0,
    );
    const blockValue = sumEffectValue(state, "PLAYER", "Block");
    console.log("dragged value, block value: ", draggedValue, blockValue);
    targets.forEach((target) => {
      // TODO: get block value on player from effects.
      dealDamageInternal(
        state,
        target.id,
        Math.floor(draggedValue / 4) + blockValue,
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
  manaCost: 18,
  targetQuantity: -1, // first target, but can't be chosen, so -1
  stateUpdater: (
    _,
    state: WritableDraft<GameState & Actions>,
    draggedTiles,
  ) => {
    const targets = Object.values(state.entities)
      .filter(isEnemy)
      .sort((a, b) => a.position - b.position);
    const draggedValue = draggedTiles.reduce(
      (total, dTile) => (total += dTile.value),
      0,
    );
    console.log("dragged value: ", draggedValue);
    dealDamageInternal(state, targets[0].id, draggedValue - 4);
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
  manaCost: 14,
  targetQuantity: -1,
  stateUpdater: (
    _,
    state: WritableDraft<GameState & Actions>,
    draggedTiles,
  ) => {
    const draggedValue = draggedTiles.reduce(
      (total, dTile) => (total += dTile.value),
      0,
    );
    const targets = Object.values(state.entities).filter(isEnemy);
    targets.forEach((target) => {
      addEffectInternal(
        state,
        target.id,
        "Freeze",
        {},
        {
          durationSlides: Math.floor(draggedValue / 4),
        },
      );
    });
    return state;
  },
};

const airSwapSpell: Spell = {
  name: "Dance of Air",
  description:
    "Sends the front enemy to the back and deals [TILEVALUE / 8] damage to them",
  requiredTiles: [
    { tileName: airTile.name, tileValue: "x" },
    { tileName: airTile.name, tileValue: "x" },
  ],
  targets: "ENEMY",
  manaCost: 18,
  targetQuantity: -1, // first target, but can't be chosen, so -1
  stateUpdater: (
    _,
    state: WritableDraft<GameState & Actions>,
    draggedTiles,
  ) => {
    const targets = Object.values(state.entities)
      .filter(isEnemy)
      .sort((a, b) => a.position - b.position);
    const draggedValue = draggedTiles.reduce(
      (total, dTile) => (total += dTile.value),
      0,
    );
    console.log("targets ", targets);
    dealDamageInternal(state, targets[0].id, draggedValue / 8);
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
  manaCost: 15,
  targetQuantity: -1, // doesn't matter, all enemies.
  stateUpdater: (_, state: WritableDraft<GameState & Actions>, tiles) => {
    const targets = Object.values(state.entities).filter(isEnemy);
    const tileValue = tiles.reduce((total, dTile) => (total += dTile.value), 0);
    targets.forEach((target) => {
      dealDamageInternal(state, target.id, tileValue / 2);
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
