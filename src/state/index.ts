import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
// import chooseWeightedOption from "../helpers/chooseWeightedOption.ts";
import { Upgrade } from "../upgrades.ts";
import { addRandomTile } from "../helpers/addRandomTile.ts";

type Direction = "up" | "down" | "left" | "right";

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

export type Tile = {
  position: Coordinate;
  value: number | string;
  id: number;
};

export type GameState = {
  // tiles: { [key: string]: Tile };
  tiles: Tile[];
  boardWidth: number;
  boardHeight: number;
  score: number;
  gold: number;

  shopping: { tileId: number; tier: string } | null;
};

export type Actions = {
  move: (direction: Direction) => void;
  resetGame: () => void;
  openShopping: (tier: string, tileId: number) => void;
  closeShopping: () => void;
  applyUpgrade: (u: Upgrade) => void;
};

export const useGameStore = create<GameState & Actions>()(
  immer((set) => ({
    tiles: [],
    boardHeight: 4,
    boardWidth: 4,
    score: 0,
    gold: 0,
    shopping: null,

    applyUpgrade: (upgrade: Upgrade) =>
      set((state) => {
        state = upgrade.stateUpdater(state);
        state.gold -= upgrade.cost;
      }),

    openShopping: (tier: string, tileId: number) =>
      set((state) => {
        state.shopping = { tier, tileId };
      }),

    closeShopping: () =>
      set((state) => {
        const tileIndexToRemove = state.tiles.findIndex(
          (t) => t.id === state.shopping?.tileId,
        );
        state.tiles.splice(tileIndexToRemove, 1);
        state.shopping = null;
      }),

    move: (direction: Direction) =>
      set((state) => {
        // build traversals
        const vector = directionMap[direction];
        const traversals = buildTraversals(
          vector,
          state.boardWidth,
          state.boardHeight,
        );
        let moved = false;

        traversals.x.forEach((xTrav) => {
          traversals.y.forEach((yTrav) => {
            const currentCell = { x: xTrav, y: yTrav };

            const tileHere = state.tiles.find(
              (t) =>
                t.position.x === currentCell.x &&
                t.position.y === currentCell.y,
            );

            if (tileHere) {
              const positions = findFarthestPosition(
                currentCell,
                vector,
                state.tiles,
                state.boardWidth,
                state.boardHeight,
              );

              const nextPotentialTile = state.tiles.find(
                (t) =>
                  t.position.x === positions.next.x &&
                  t.position.y === positions.next.y,
              );

              if (
                nextPotentialTile &&
                nextPotentialTile.value === tileHere.value
              ) {
                // move the tile that's about to be deleted so that it looks good
                tileHere.position = positions.next;

                // delete the merging tiles
                const nextTileIx = state.tiles.findIndex(
                  (t) => t.id === nextPotentialTile.id,
                );
                state.tiles.splice(nextTileIx, 1);

                // const hereTileIx = state.tiles.findIndex(
                //   (t) => t.id === tileHere.id,
                // );
                // state.tiles.splice(hereTileIx, 1);

                // make a new tile
                // state.tiles.push({
                //   id: `${Math.random()}-id`,
                //   value: nextPotentialTile.value + tileHere.value,
                //   position: positions.next,
                // });
                tileHere.position = positions.next;
                if (
                  typeof nextPotentialTile.value === "number" &&
                  typeof tileHere.value === "number"
                ) {
                  tileHere.value = nextPotentialTile.value + tileHere.value;

                  // update the score
                  state.score += tileHere.value;
                } else {
                  // we're assuming it's just the $ tiles here for now
                  tileHere.value =
                    nextPotentialTile.value.toString() +
                    tileHere.value.toString();

                  // add gold equal to the amount of $$ signs combined
                  state.gold += tileHere.value.length;
                }
              } else {
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
          state.tiles.push(
            addRandomTile(state.tiles, state.boardWidth, state.boardHeight),
          );
        }
      }),

    resetGame: () => {
      set((state) => {
        state.score = 0;
        state.gold = 0;
        state.boardWidth = 4;
        state.boardHeight = 4;
        state.tiles = [];
        const tile1 = addRandomTile(
          state.tiles,
          state.boardWidth,
          state.boardHeight,
        );
        state.tiles.push(tile1);

        const tile2 = addRandomTile(
          state.tiles,
          state.boardWidth,
          state.boardHeight,
        );
        state.tiles.push(tile2);
      });
    },
  })),
);

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
