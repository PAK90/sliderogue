import { WritableDraft } from "immer";
import { Actions, GameState, Tile } from "../state";
import shuffleArray from "../helpers/shuffleArray.ts";
// import { tile8 } from "./tiles.ts";

export type UpgradeType = "BOARD" | "TILE";
export type Upgrade = {
  name: string;
  description: string;
  type: UpgradeType;
  stateUpdater: (
    state: WritableDraft<GameState & Actions>,
  ) => WritableDraft<GameState & Actions>;
  cost: number;
  tier: number;
  weight: number;
  costMultiplier: number;
  minTiles: number;
  maxTiles: number;
};

const widthUpgrade: Upgrade = {
  name: "Enwiden",
  description: "Expands the grid 1 column to the right",
  stateUpdater: (state: WritableDraft<GameState & Actions>) => {
    state.boards[0].boardWidth++;
    return state;
  },
  type: "BOARD",
  cost: 15,
  tier: 2,
  weight: 100,
  costMultiplier: 10,
  minTiles: 0,
  maxTiles: 0,
};

const heightUpgrade: Upgrade = {
  name: "Enheighten",
  description: "Expands the grid 1 row down",
  stateUpdater: (state: WritableDraft<GameState & Actions>) => {
    state.boards[0].boardHeight++;
    return state;
  },
  type: "BOARD",
  cost: 15,
  tier: 2,
  weight: 100,
  costMultiplier: 10,
  minTiles: 0,
  maxTiles: 0,
};

const silverUpgrade: Upgrade = {
  name: "Silver Engraving",
  description:
    "Upgrades up to two tiles to be Silver." +
    "\nSilver tiles cost 50% less mana to combine",
  stateUpdater: (state: WritableDraft<GameState & Actions>) => {
    const board = state.boards[0];
    // const selectedTiles = board.selectedTiles;
    // selectedTiles.forEach((selTile) => {
    //   const tile = board.tiles.find((tile) => tile.id === selTile.id);
    //   if (tile) {
    //     tile.upgrades.push("SILVER");
    //   } else {
    //     throw Error(
    //       "Somehow have a selected tile that has no equivalent real tile.",
    //     );
    //   }
    // });
    const { selectedDeckTiles } = board;
    selectedDeckTiles.forEach((tileIx) => {
      const potentialUpgrades = board.upgradedDeck[tileIx].upgrades;
      if (potentialUpgrades) {
        potentialUpgrades.push("SILVER");
      } else {
        board.upgradedDeck[tileIx].upgrades = ["SILVER"];
      }
    });
    const deckFromSpawns = board.availableSpells[0].spell.spawns
      .map((st) => Array.from({ length: 20 }, () => ({ ...st })))
      .flat();
    board.usableDeck = shuffleArray(deckFromSpawns.concat(board.upgradedDeck));
    return state;
  },
  type: "TILE",
  cost: 2,
  tier: 2,
  weight: 100,
  costMultiplier: 2,
  minTiles: 1,
  maxTiles: 2,
};

const goldUpgrade: Upgrade = {
  name: "Gold Plating",
  description:
    "Upgrades up to two tiles to be Gold." +
    "\nGold tiles are worth 3 gold at the end of a round (instead of 1)",
  stateUpdater: (state: WritableDraft<GameState & Actions>) => {
    const board = state.boards[0];
    // const selectedTiles = board.selectedTiles;
    // selectedTiles.forEach((selTile) => {
    //   const tile = board.tiles.find((tile) => tile.id === selTile.id);
    //   if (tile) {
    //     tile.upgrades.push("GOLD");
    //   } else {
    //     throw Error(
    //       "Somehow have a selected tile that has no equivalent real tile.",
    //     );
    //   }
    // });
    const { selectedDeckTiles } = board;
    selectedDeckTiles.forEach((tileIx) => {
      const potentialUpgrades = board.upgradedDeck[tileIx].upgrades;
      if (potentialUpgrades) {
        potentialUpgrades.push("GOLD");
      } else {
        board.upgradedDeck[tileIx].upgrades = ["GOLD"];
      }
    });
    const deckFromSpawns = board.availableSpells[0].spell.spawns
      .map((st) => Array.from({ length: 20 }, () => ({ ...st })))
      .flat();
    board.usableDeck = shuffleArray(deckFromSpawns.concat(board.upgradedDeck));
    return state;
  },
  type: "TILE",
  cost: 4,
  tier: 2,
  weight: 100,
  costMultiplier: 2,
  minTiles: 1,
  maxTiles: 2,
};

const shuffle: Upgrade = {
  name: "Shuffle",
  description: "Randomises all the tile positions",
  stateUpdater: (state: WritableDraft<GameState & Actions>) => {
    const randomTiles: Tile[] = [];

    state.boards[0].tiles.forEach((tile) => {
      let potentialNewCellPos = {
        x: Math.floor(Math.random() * state.boards[0].boardWidth),
        y: Math.floor(Math.random() * state.boards[0].boardHeight),
      };
      while (
        randomTiles.find(
          (t) =>
            t.position.x === potentialNewCellPos.x &&
            t.position.y === potentialNewCellPos.y,
        )
      ) {
        potentialNewCellPos = {
          x: Math.floor(Math.random() * state.boards[0].boardWidth),
          y: Math.floor(Math.random() * state.boards[0].boardHeight),
        };
      }

      randomTiles.push({ ...tile, position: potentialNewCellPos });
    });
    state.boards[0].tiles = randomTiles;
    return state;
  },
  type: "BOARD",
  cost: 3,
  tier: 1,
  weight: 100,
  costMultiplier: 2,
  minTiles: 0,
  maxTiles: 0,
};

// const addEightTile: Upgrade = {
//   name: "8-Tile",
//   description: "Adds a chance to spawn an 8 tile",
//   stateUpdater: (state: WritableDraft<GameState & Actions>) => {
//     const found8Tile = state.tilesToSpawn.find((ts) => ts.id === 8);
//     if (found8Tile) {
//       found8Tile.weight += tile8.weight;
//     } else {
//       state.tilesToSpawn.push(tile8);
//     }
//     return state;
//   },
//   cost: 2,
//   tier: 1,
//   weight: 100,
// };

// const upgradeShopTile: Upgrade = {
//   name: "Frequent Shopper",
//   description: "Increases the chance to spawn a $ tile",
//   stateUpdater: (state: WritableDraft<GameState & Actions>) => {
//     const found8Tile = state.tilesToSpawn.find((ts) => ts.id === "$");
//     if (found8Tile) {
//       found8Tile.weight += .weight;
//     }
//     return state;
//   },
//   cost: 4,
//   tier: 1,
//   weight: 100,
// };

// const addDivTwoTile: Upgrade = {
//   name: "÷2 Tile",
//   description: "Adds a chance to spawn a ÷2 tile",
//   stateUpdater: (state: WritableDraft<GameState & Actions>) => {
//     const foundDiv2Tile = state.tilesToSpawn.find((ts) => ts.id === "÷2");
//     if (foundDiv2Tile) {
//       foundDiv2Tile.weight += div2Tile.weight;
//     } else {
//       state.tilesToSpawn.push(div2Tile);
//     }
//     return state;
//   },
//   cost: 2,
//   tier: 1,
//   weight: 100,
// };

export const upgrades = [
  // addEightTile,
  // addDivTwoTile,
  widthUpgrade,
  heightUpgrade,
  // upgradeShopTile,
  shuffle,
  silverUpgrade,
  goldUpgrade,
];
