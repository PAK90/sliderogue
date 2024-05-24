import { airTile, earthTile, fireTile, waterTile } from "./tiles.ts";

export type Spell = {
  name: string;
  requiredTiles: {
    tileName: string;
    tileValue: number;
  }[];
};

const steamSpell: Spell = {
  name: "Steam Cooker",
  requiredTiles: [
    { tileName: fireTile.id, tileValue: 4 },
    { tileName: fireTile.id, tileValue: 16 },
    { tileName: waterTile.id, tileValue: 4 },
    { tileName: waterTile.id, tileValue: 16 },
  ],
};

const lavaSpell: Spell = {
  name: "Lava Flow",
  requiredTiles: [
    { tileName: fireTile.id, tileValue: 4 },
    { tileName: fireTile.id, tileValue: 16 },
    { tileName: earthTile.id, tileValue: 4 },
    { tileName: earthTile.id, tileValue: 16 },
  ],
};

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

const rainbowSpell: Spell = {
  name: "Taste the Rainbow",
  requiredTiles: [
    { tileName: fireTile.id, tileValue: 4 },
    { tileName: waterTile.id, tileValue: 4 },
    { tileName: earthTile.id, tileValue: 4 },
    { tileName: airTile.id, tileValue: 4 },
  ],
};

export const spells = [steamSpell, rainbowSpell, lavaSpell];
