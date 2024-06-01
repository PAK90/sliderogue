import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
// import chooseWeightedOption from "../helpers/chooseWeightedOption.ts";
// import { Upgrade } from "../upgrades.ts";
import { addRandomTile } from "../helpers/addRandomTile.ts";
// import { defaultTiles } from "../tiles.ts";
import { Option } from "../helpers/chooseWeightedOption.ts";
import { defaultDeck, defaultTiles } from "../data/tiles.ts";
import { chooseEmptyTilePosition } from "../helpers/chooseEmptyTilePosition.ts";
import { chooseTilesFromBag } from "../helpers/chooseTilesFromBag.ts";

export type Direction = "up" | "down" | "left" | "right";

const directionMap = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export type Coordinate = {
  x: number;
  y: number;
};

export type TileType = "WEAPON" | "ENEMY" | "NUMBER" | "ELEMENTAL";

export type Tile = {
  position: Coordinate;
  value: number;
  name: string;
  id: number;
  type: TileType;
};

export type BoardState = {
  tiles: Tile[];
  boardWidth: number;
  boardHeight: number;
  score: number;
  mana: number;

  deck: Option[];

  // keeping this around in case we want to spawn tiles not out of the deck, which seems likely...
  // spawns from joker/artifact type things.
  newTilesToSpawn: Option[];
};

export type GameState = {
  boards: BoardState[];
};

export type Actions = {
  move: (direction: Direction, boardIndex?: number) => void;
  resetGame: () => void;
  // openShopping: (tier: string, tileId: number) => void;
  // closeShopping: () => void;
  // applyUpgrade: (u: Upgrade) => void;
  // setTilesToSpawn: (t: Option[]) => void;
};

export const useGameStore = create<GameState & Actions>()(
  immer((set) => ({
    boards: [],

    // setTilesToSpawn: (o: Option[]) =>
    //   set((state) => {
    //     // state.boards[0].baseTilesToSpawn = o;
    //   }),

    // applyUpgrade: (upgrade: Upgrade) =>
    //   set((state) => {
    //     state = upgrade.stateUpdater(state);
    //     state.boards[0].gold -= upgrade.cost;
    //   }),
    //
    // openShopping: (tier: string, tileId: number) =>
    //   set((state) => {
    //     state.boards[0].shopping = { tier, tileId };
    //   }),
    //
    // closeShopping: () =>
    //   set((state) => {
    //     const tileIndexToRemove = state.boards[0].tiles.findIndex(
    //       (t) => t.id === state.boards[0].shopping?.tileId,
    //     );
    //     state.boards[0].tiles.splice(tileIndexToRemove, 1);
    //     state.boards[0].shopping = null;
    //   }),

    move: (direction: Direction, boardIndex = 0) =>
      set((state) => {
        // build traversals
        const vector = directionMap[direction];
        const traversals = buildTraversals(
          vector,
          state.boards[boardIndex].boardWidth,
          state.boards[boardIndex].boardHeight,
        );
        let moved = false;

        traversals.x.forEach((xTrav) => {
          traversals.y.forEach((yTrav) => {
            const currentCell = { x: xTrav, y: yTrav };

            const tileHere = state.boards[boardIndex].tiles.find(
              (t) =>
                t.position.x === currentCell.x &&
                t.position.y === currentCell.y,
            );

            if (tileHere) {
              const positions = findFarthestPosition(
                currentCell,
                vector,
                state.boards[boardIndex].tiles,
                state.boards[boardIndex].boardWidth,
                state.boards[boardIndex].boardHeight,
              );

              const nextPotentialTile = state.boards[boardIndex].tiles.find(
                (t) =>
                  t.position.x === positions.next.x &&
                  t.position.y === positions.next.y,
              );

              if (
                nextPotentialTile &&
                // tileHere.name === nextPotentialTile.name &&
                tileHere.value === nextPotentialTile.value
              ) {
                // move the tile that's about to be deleted so that it looks good
                tileHere.position = positions.next;

                // delete the merging tiles
                const nextTileIx = state.boards[boardIndex].tiles.findIndex(
                  (t) => t.id === nextPotentialTile.id,
                );
                state.boards[boardIndex].tiles.splice(nextTileIx, 1);

                tileHere.position = positions.next;
                // tileHere.value = nextPotentialTile.value + tileHere.value;
                tileHere.value *= 2;

                // update the score... and mana.
                state.boards[boardIndex].score += tileHere.value;
              } else {
                // no tile collision, just move the current tile along.
                tileHere.position = positions.farthest;
              }
              if (
                tileHere.position.x !== currentCell.x ||
                tileHere.position.y !== currentCell.y
              ) {
                moved = true;
              }
            }
          });
        });

        if (moved) {
          // add a random tile
          state.boards[boardIndex].tiles.push(
            addRandomTile(
              state.boards[boardIndex].tiles,
              state.boards[boardIndex].boardWidth,
              state.boards[boardIndex].boardHeight,
              [...state.boards[boardIndex].newTilesToSpawn],
            ),
          );
        }
      }),

    resetGame: () => {
      set((state) => {
        // TODO: insert a deck of tiles here.
        const myBoard = initBoard(4, 4, defaultDeck);
        state.boards = [myBoard];
      });
    },
  })),
);

const initBoard = (
  width: number,
  height: number,
  // tilesToStart: Option[],
  // baseTilesToSpawn: Option[],
  deckOfTiles: Option[],
) => {
  const newBoardState: BoardState = {
    score: 0,
    mana: 0,
    boardWidth: width,
    boardHeight: height,
    tiles: [],
    newTilesToSpawn: [],
    deck: deckOfTiles,
    // newTilesToSpawn: [],
  };
  // const tilesToAdd = newBoardState.baseTilesToSpawn.reduce((tta, option) => {
  //   tta.push(
  //     // @ts-expect-error stupid never
  //     addRandomTile(tta, newBoardState.boardWidth, newBoardState.boardHeight, [
  //       option,
  //     ]),
  //   );
  //   return tta;
  // }, []);
  // newBoardState.tiles = newBoardState.tiles.concat(tilesToAdd);
  //
  // // but after this, we want the spawn pool to be different... includes wildcards and 4-tiles.
  // newBoardState.baseTilesToSpawn = baseTilesToSpawn;

  const startingSpots = [0, 1].reduce(
    (chosenCells) => {
      return [
        ...chosenCells,
        chooseEmptyTilePosition(width, height, chosenCells),
      ];
    },
    [] as { position: Coordinate }[],
  );

  const { deck, chosenTiles } = chooseTilesFromBag(deckOfTiles, 2);

  return newBoardState;
};

// const tilesCanMerge = (t1: Tile, t2: Tile) => {
//   const specialTileIds = [div2Tile, x2Tile].map((t) => t.id);
//   if (
//     specialTileIds.includes(t1.value.toString()) ||
//     specialTileIds.includes(t2.value.toString())
//   ) {
//     return true;
//   } else if (t1.value === t2.value) return true;
//   return false;
// };

// const calculateNewValue = (t1: Tile, t2: Tile) => {
//   const specialTileIds = [div2Tile, x2Tile].map((t) => t.id);
//
//   if (typeof t1.value === "number" && typeof t2.value === "number") {
//     return t1.value + t2.value;
//   } else if (specialTileIds.includes(t1.value.toString())) {
//     if (t2.value.toString().indexOf("$") > -1) {
//       return t1.value === "x2"
//         ? t2.value.toString() + t2.value.toString()
//         : range(t2.value.toString().length / 2, "$");
//     } else {
//       return t1.value === "x2" ? t2.value * 2 : t2.value / 2;
//     }
//   } else if (specialTileIds.includes(t2.value.toString())) {
//     if (t1.value.toString().indexOf("$") > -1) {
//       return t2.value === "x2"
//         ? t1.value.toString() + t2.value.toString()
//         : range(t2.value.toString().length / 2, "$");
//     } else {
//       return t2.value === "x2" ? t1.value * 2 : t1.value / 2;
//     }
//   }
// };

const findFarthestPosition = (
  cell: Coordinate,
  vector: Coordinate,
  tiles: Tile[],
  width: number,
  height: number,
) => {
  let previous;
  let next = cell;

  const withinBounds = (pos: Coordinate) => {
    return pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height;
  };
  const isCellOccupied = (pos: Coordinate) => {
    return tiles.find((t) => t.position.x === pos.x && t.position.y === pos.y);
  };

  do {
    previous = next;
    next = { x: previous.x + vector.x, y: previous.y + vector.y };
  } while (withinBounds(next) && !isCellOccupied(next));

  return {
    farthest: previous,
    next,
  };
};

const buildTraversals = (vector: Coordinate, width: number, height: number) => {
  const traversals: { x: number[]; y: number[] } = { x: [], y: [] };

  for (let pos = 0; pos < width; pos++) {
    traversals.x.push(pos);
  }
  for (let pos = 0; pos < height; pos++) {
    traversals.y.push(pos);
  }

  // Always traverse from the farthest cell in the chosen direction
  if (vector.x === 1) traversals.x = traversals.x.reverse();
  if (vector.y === 1) traversals.y = traversals.y.reverse();

  return traversals;
};
