import { WritableDraft } from "immer";
import { Actions, GameState, Tile } from "./state";
import { tile8 } from "./tiles.ts";

export type Upgrade = {
  name: string;
  description: string;
  stateUpdater: (
    state: WritableDraft<GameState & Actions>,
  ) => WritableDraft<GameState & Actions>;
  cost: number;
  tier: number;
  weight: number;
};

const widthUpgrade: Upgrade = {
  name: "Enwiden",
  description: "Expands the grid 1 column to the right",
  stateUpdater: (state: WritableDraft<GameState & Actions>) => {
    state.boardWidth++;
    return state;
  },
  cost: 4,
  tier: 2,
  weight: 100,
};

const heightUpgrade: Upgrade = {
  name: "Enheighten",
  description: "Expands the grid 1 row down",
  stateUpdater: (state: WritableDraft<GameState & Actions>) => {
    state.boardHeight++;
    return state;
  },
  cost: 4,
  tier: 2,
  weight: 100,
};

const shuffle: Upgrade = {
  name: "Shuffle",
  description: "Randomises all the tile positions",
  stateUpdater: (state: WritableDraft<GameState & Actions>) => {
    const randomTiles: Tile[] = [];

    state.tiles.forEach((tile) => {
      let potentialNewCellPos = {
        x: Math.floor(Math.random() * state.boardWidth),
        y: Math.floor(Math.random() * state.boardHeight),
      };
      while (
        randomTiles.find(
          (t) =>
            t.position.x === potentialNewCellPos.x &&
            t.position.y === potentialNewCellPos.y,
        )
      ) {
        potentialNewCellPos = {
          x: Math.floor(Math.random() * state.boardWidth),
          y: Math.floor(Math.random() * state.boardHeight),
        };
      }

      randomTiles.push({ ...tile, position: potentialNewCellPos });
    });
    state.tiles = randomTiles;
    return state;
  },
  cost: 2,
  tier: 1,
  weight: 100,
};

const addEightTile: Upgrade = {
  name: "8-Tile",
  description: "Adds a chance to spawn an 8 tile",
  stateUpdater: (state: WritableDraft<GameState & Actions>) => {
    const found8Tile = state.tilesToSpawn.find((ts) => ts.id === 8);
    if (found8Tile) {
      found8Tile.weight += tile8.weight;
    } else {
      state.tilesToSpawn.push(tile8);
    }
    return state;
  },
  cost: 2,
  tier: 1,
  weight: 100,
};

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
  addEightTile,
  // addDivTwoTile,
  widthUpgrade,
  heightUpgrade,
  shuffle,
];
