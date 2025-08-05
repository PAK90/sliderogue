import { fireTile, waterTile } from "./tiles.ts";
import { Option } from "../helpers/chooseWeightedOption.ts";
import { WritableDraft } from "immer";
import { Actions, GameState } from "../state";

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
    tileValue: number;
  }[];
  targets: "PLAYER" | "ENEMY" | "ALL"; //
  targetQuantity: number;
  stateUpdater: (
    targets: number[], // indices of enemies, since if it's player we don't need, and ALL is all.
    state: WritableDraft<GameState & Actions>,
  ) => WritableDraft<GameState & Actions>;
  spawns: Option[];
};

// const steamSpell: Spell = {
//   name: "Steam Cooker",
//   requiredTiles: [
//     { tileName: fireTile.id, tileValue: 4 },
//     { tileName: fireTile.id, tileValue: 8 },
//     { tileName: waterTile.id, tileValue: 4 },
//     { tileName: waterTile.id, tileValue: 8 },
//   ],
//   // essentially doubling the chance of getting fire and water tiles
//   spawns: [fireTile, waterTile],
// };
//
// const lavaSpell: Spell = {
//   name: "Lava Flow",
//   requiredTiles: [
//     { tileName: fireTile.id, tileValue: 4 },
//     { tileName: fireTile.id, tileValue: 8 },
//     { tileName: earthTile.id, tileValue: 4 },
//     { tileName: earthTile.id, tileValue: 8 },
//   ],
//   spawns: [fireTile, earthTile],
// };
//
// const sandstormSpell: Spell = {
//   name: "Sand Storm",
//   requiredTiles: [
//     { tileName: airTile.id, tileValue: 4 },
//     { tileName: airTile.id, tileValue: 8 },
//     { tileName: earthTile.id, tileValue: 4 },
//     { tileName: earthTile.id, tileValue: 8 },
//   ],
//   spawns: [airTile, earthTile],
// };
//
// const mistySpell: Spell = {
//   name: "Morning Mist",
//   requiredTiles: [
//     { tileName: waterTile.id, tileValue: 4 },
//     { tileName: waterTile.id, tileValue: 8 },
//     { tileName: airTile.id, tileValue: 4 },
//     { tileName: airTile.id, tileValue: 8 },
//   ],
//   spawns: [waterTile, airTile],
// };
//
// const mudflowSpell: Spell = {
//   name: "Mud Flow",
//   requiredTiles: [
//     { tileName: waterTile.id, tileValue: 4 },
//     { tileName: waterTile.id, tileValue: 8 },
//     { tileName: earthTile.id, tileValue: 4 },
//     { tileName: earthTile.id, tileValue: 8 },
//   ],
//   spawns: [waterTile, earthTile],
// };
//
// const staticsparkSpell: Spell = {
//   name: "Static Sparks",
//   requiredTiles: [
//     { tileName: fireTile.id, tileValue: 4 },
//     { tileName: fireTile.id, tileValue: 8 },
//     { tileName: airTile.id, tileValue: 4 },
//     { tileName: airTile.id, tileValue: 8 },
//   ],
//   spawns: [fireTile, airTile],
// };

// const waterHoseSpell: Spell = {
//   name: "Water Hose",
//   requiredTiles: [
//     { tileName: waterTile.id, tileValue: 16 },
//     { tileName: waterTile.id, tileValue: 32 },
//     { tileName: waterTile.id, tileValue: 64 },
//   ],
// };
//
// const fireConeSpell: Spell = {
//   name: "Fire Cone",
//   requiredTiles: [
//     { tileName: fireTile.id, tileValue: 16 },
//     { tileName: fireTile.id, tileValue: 32 },
//     { tileName: fireTile.id, tileValue: 64 },
//   ],
// };

// const rainbowSpell: Spell = {
//   name: "Taste the Rainbow",
//   requiredTiles: [
//     { tileName: fireTile.id, tileValue: 8 },
//     { tileName: waterTile.id, tileValue: 8 },
//     { tileName: earthTile.id, tileValue: 8 },
//     { tileName: airTile.id, tileValue: 8 },
//   ],
//   spawns: [],
// };

// const airSpell1: Spell = {
//   name: "Static Sparks",
//   requiredTiles: [
//     { tileName: airTile.id, tileValue: 4 },
//     { tileName: fireTile.id, tileValue: 4 },
//     { tileName: airTile.id, tileValue: 8 },
//     { tileName: fireTile.id, tileValue: 8 },
//   ],
//   spawns: [airTile, fireTile],
// };
//
// const airSpell2: Spell = {
//   name: "Static Sparks2",
//   requiredTiles: [
//     { tileName: airTile.id, tileValue: 2 },
//     { tileName: fireTile.id, tileValue: 4 },
//     { tileName: airTile.id, tileValue: 8 },
//     { tileName: fireTile.id, tileValue: 16 },
//   ],
//   spawns: [airTile, fireTile],
// };
//
// const airSpell3: Spell = {
//   name: "Static Sparks3",
//   requiredTiles: [
//     { tileName: airTile.id, tileValue: 16 },
//     { tileName: fireTile.id, tileValue: 16 },
//     { tileName: airTile.id, tileValue: 16 },
//   ],
//   spawns: [airTile, fireTile],
// };
//
// const airSpell4: Spell = {
//   name: "Static Sparks4",
//   requiredTiles: [
//     { tileName: airTile.id, tileValue: 2 },
//     { tileName: fireTile.id, tileValue: 2 },
//     { tileName: airTile.id, tileValue: 4 },
//     { tileName: fireTile.id, tileValue: 4 },
//     { tileName: airTile.id, tileValue: 4 },
//   ],
//   spawns: [airTile, fireTile],
// };

const fireballSpell: Spell = {
  name: "Fireball",
  description: "Fires a flaming sphere at up to 2 targets.",
  requiredTiles: [
    { tileName: fireTile.id, tileValue: 2 },
    { tileName: fireTile.id, tileValue: 4 },
    // { tileName: fireTile.id, tileValue: 8 },
  ],
  spawns: [fireTile],
  targets: "ENEMY",
  targetQuantity: 2,
  stateUpdater: (targets, state: WritableDraft<GameState & Actions>) => {
    targets.forEach((target) => {
      state.enemies[target].currentHealth -= 5;
    });
    return state;
  },
};

const waterHealingSpell: Spell = {
  name: "Vitamin Water",
  description: "Heals you for 11 health.",
  requiredTiles: [
    { tileName: waterTile.id, tileValue: 2 },
    { tileName: waterTile.id, tileValue: 4 },
    // { tileName: waterTile.id, tileValue: 8 },
  ],
  spawns: [waterTile],
  targets: "PLAYER",
  targetQuantity: 0, // shouldn't matter here with PLAYER as target
  stateUpdater: (_, state: WritableDraft<GameState & Actions>) => {
    state.player.currentHealth += 11;
    return state;
  },
};

export const spells = [
  // steamSpell,
  // rainbowSpell,
  // lavaSpell,
  // staticsparkSpell,
  // mistySpell,
  // mudflowSpell,
  // sandstormSpell,
  // airSpell1,
  // airSpell2,
  // airSpell3,
  // airSpell4,
  fireballSpell,
  waterHealingSpell,
];
