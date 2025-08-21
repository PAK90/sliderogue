import { fireTile, waterTile } from "./tiles.ts";
// import { Option } from "../helpers/chooseWeightedOption.ts";
import { WritableDraft } from "immer";
import { Actions, GameState, Tile } from "../state";

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
  targets: "PLAYER" | "ENEMY" | "ENEMIES" | "ALL";
  targetQuantity: number;
  stateUpdater: (
    targets: number[], // indices of enemies, since if it's player we don't need, and ALL is all.
    state: WritableDraft<GameState & Actions>,
    satisfiedDraggedTiles: Tile[],
  ) => WritableDraft<GameState & Actions>;
  // spawns: Option[];
};

const fireballSpell: Spell = {
  name: "Fireball",
  description: "Deal TILEVALUE damage to all enemies.",
  requiredTiles: [
    { tileName: fireTile.name, tileValue: "x" },
    { tileName: fireTile.name, tileValue: "2x" },
  ],
  // spawns: [fireTile],
  targets: "ENEMIES",
  targetQuantity: -1, // doesn't matter, all enemies.
  stateUpdater: (
    _,
    state: WritableDraft<GameState & Actions>,
    draggedTiles,
  ) => {
    const targets = state.waves[state.activeWave];
    const draggedValue = draggedTiles.reduce(
      (total, dTile) => (total += dTile.value),
      0,
    );
    console.log("dragged value: ", draggedValue);
    targets.forEach((target) => {
      target.currentHealth -= draggedValue;
    });
    return state;
  },
};

const waterHealingSpell: Spell = {
  name: "Vitamin Water",
  description: "Heals you for TILEVALUE * 2 health.",
  requiredTiles: [
    { tileName: waterTile.name, tileValue: "x" },
    { tileName: waterTile.name, tileValue: "2x" },
  ],
  // spawns: [waterTile],
  targets: "PLAYER",
  targetQuantity: 0, // shouldn't matter here with PLAYER as target
  stateUpdater: (
    _,
    state: WritableDraft<GameState & Actions>,
    draggedTiles,
  ) => {
    const draggedValue = draggedTiles.reduce(
      (total, dTile) => (total += dTile.value),
      0,
    );
    console.log("dragged value: ", draggedValue);
    state.player.currentHealth = Math.min(
      state.player.maxHealth,
      state.player.currentHealth + draggedValue * 2,
    );
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
