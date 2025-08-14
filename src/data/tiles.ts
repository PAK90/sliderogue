import { Option } from "../helpers/chooseWeightedOption.ts";

const tile2: Option = {
  name: "2",
  weight: 80,
  type: "NUMBER",
  fromLine: false,
};
const tile4: Option = {
  name: "4",
  weight: 10,
  type: "NUMBER",
  fromLine: false,
};
const storeTile: Option = {
  name: "$",
  weight: 5,
  type: "NUMBER",
  fromLine: false,
};

export const swordTile: Option = {
  name: "†",
  weight: 100,
  type: "WEAPON",
  fromLine: false,
};
export const zombieTile: Option = {
  name: "Z",
  weight: 100,
  type: "ENEMY",
  fromLine: false,
};

export const fireTile: Option = {
  name: "F",
  weight: 100,
  type: "ELEMENTAL",
  fromLine: false,
};
export const waterTile: Option = {
  name: "W",
  weight: 100,
  type: "ELEMENTAL",
  fromLine: false,
};
export const earthTile: Option = {
  name: "E",
  weight: 100,
  type: "ELEMENTAL",
  fromLine: false,
};
export const airTile: Option = {
  name: "A",
  weight: 100,
  type: "ELEMENTAL",
  fromLine: false,
};
// export const fire4Tile: Option = { ...fireTile, weight: 10, value: 4 };
// export const water4Tile: Option = { ...waterTile, weight: 10, value: 4 };

// export const tile8 = { name: 8, weight: 10 };
// export const x2Tile = { name: "x2", weight: 5 };
// export const div2Tile = { name: "÷2", weight: 5 };

// TODO: add an onMerge prop which could be used to blow stuff up or clear columns or other special fx

export const defaultTiles = [tile2, tile4, storeTile];
export const weaponTiles = [swordTile];
export const enemyTiles = [zombieTile];

export const elementalTiles = [fireTile, waterTile, earthTile, airTile];
export const elemental4Tiles = [
  fireTile,
  { ...fireTile, value: 4, weight: 10 },
  waterTile,
  { ...waterTile, value: 4, weight: 10 },
  earthTile,
  { ...earthTile, value: 4, weight: 10 },
  airTile,
  { ...airTile, value: 4, weight: 10 },
];

const allTheFires = Array.from({ length: 20 }, () => ({ ...fireTile }));
const allTheWaters = Array.from({ length: 20 }, () => ({ ...waterTile }));
export const defaultDeck = [...allTheFires, ...allTheWaters];
