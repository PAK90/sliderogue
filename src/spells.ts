import { fireTile, waterTile } from "./tiles.ts";

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
    { tileName: fireTile.id, tileValue: 32 },
    { tileName: waterTile.id, tileValue: 4 },
    { tileName: waterTile.id, tileValue: 16 },
    { tileName: waterTile.id, tileValue: 32 },
  ],
};

const waterHoseSpell: Spell = {
  name: "Water Hose",
  requiredTiles: [
    { tileName: waterTile.id, tileValue: 16 },
    { tileName: waterTile.id, tileValue: 32 },
    { tileName: waterTile.id, tileValue: 64 },
  ],
};

const fireConeSpell: Spell = {
  name: "Fire Cone",
  requiredTiles: [
    { tileName: fireTile.id, tileValue: 16 },
    { tileName: fireTile.id, tileValue: 32 },
    { tileName: fireTile.id, tileValue: 64 },
  ],
};

export const spells = [steamSpell, waterHoseSpell, fireConeSpell];
