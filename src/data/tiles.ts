import { Option } from "../helpers/chooseWeightedOption.ts";

const tile2: Option = { name: "2", weight: 80, type: "NUMBER" };
const tile4: Option = { name: "4", weight: 10, type: "NUMBER" };
// const storeTile: Option = { name: "$", weight: 5, type: "NUMBER" };

export const swordTile: Option = { name: "†", weight: 100, type: "WEAPON" };
export const zombieTile: Option = { name: "Z", weight: 100, type: "ENEMY" };

export const fireTile: Option = { name: "F", weight: 100, type: "ELEMENTAL" };
export const waterTile: Option = { name: "W", weight: 100, type: "ELEMENTAL" };
export const earthTile: Option = { name: "E", weight: 100, type: "ELEMENTAL" };
export const airTile: Option = { name: "A", weight: 100, type: "ELEMENTAL" };
// export const fire4Tile: Option = { ...fireTile, weight: 10, value: 4 };
// export const water4Tile: Option = { ...waterTile, weight: 10, value: 4 };

// export const tile8 = { id: 8, weight: 10 };
// export const x2Tile = { id: "x2", weight: 5 };
// export const div2Tile = { id: "÷2", weight: 5 };

// TODO: add an onMerge prop which could be used to blow stuff up or clear columns or other special fx

export const defaultTiles = [tile2, tile4];
const allTheTwos = Array.from({ length: 40 }, () => ({ ...tile2 }));
const allTheFours = Array.from({ length: 10 }, () => ({ ...tile4 }));
export const defaultDeck = [...allTheTwos, ...allTheFours];
