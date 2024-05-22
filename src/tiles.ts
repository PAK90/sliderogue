import { Option } from "./helpers/chooseWeightedOption.ts";

const tile2: Option = { id: 2, weight: 80, type: "NUMBER" };
const tile4: Option = { id: 4, weight: 10, type: "NUMBER" };
const storeTile: Option = { id: "$", weight: 5, type: "NUMBER" };

export const swordTile: Option = { id: "†", weight: 100, type: "WEAPON" };
export const zombieTile: Option = { id: "Z", weight: 100, type: "ENEMY" };

// export const tile8 = { id: 8, weight: 10 };
// export const x2Tile = { id: "x2", weight: 5 };
// export const div2Tile = { id: "÷2", weight: 5 };

// TODO: add an onMerge prop which could be used to blow stuff up or clear columns or other special fx

export const defaultTiles = [tile2, tile4, storeTile];
export const weaponTiles = [swordTile];
export const enemyTiles = [zombieTile];
