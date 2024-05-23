import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
// import chooseWeightedOption from "../helpers/chooseWeightedOption.ts";
import { Upgrade } from "../upgrades.ts";
import { addRandomTile } from "../helpers/addRandomTile.ts";
// import { defaultTiles } from "../tiles.ts";
import { Option } from "../helpers/chooseWeightedOption.ts";
import { elementalTiles, fireTile, waterTile } from "../tiles.ts";
import { Spell, spells } from "../spells.ts";
// import range from "../helpers/range.ts";

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

export type TileType = "WEAPON" | "ENEMY" | "NUMBER" | "ELEMENTAL";

export type Tile = {
  position: Coordinate;
  value: number;
  name: string;
  id: number;
  type: TileType;
};

export type GameState = {
  // tiles: { [key: string]: Tile };
  tiles: Tile[];
  boardWidth: number;
  boardHeight: number;
  score: number;
  gold: number;

  shopping: { tileId: number; tier: string } | null;
  tilesToSpawn: Option[];
  activeSpells: { spell: Spell; complete: boolean[] }[];
};

export type Actions = {
  move: (direction: Direction) => void;
  resetGame: () => void;
  openShopping: (tier: string, tileId: number) => void;
  closeShopping: () => void;
  applyUpgrade: (u: Upgrade) => void;
  setTilesToSpawn: (t: Option[]) => void;
  enspellTile: (t: Tile) => void;
};

export const useGameStore = create<GameState & Actions>()(
  immer((set) => ({
    tiles: [],
    boardHeight: 5,
    boardWidth: 5,
    score: 0,
    gold: 0,
    shopping: null,
    tilesToSpawn: [],
    activeSpells: [],

    enspellTile: (tile: Tile) =>
      set((state) => {
        const activeSpell = state.activeSpells[0];

        const slotToFillIx = activeSpell.spell.requiredTiles.findIndex(
          (rt, rtIx) => {
            return (
              !activeSpell.complete[rtIx] &&
              rt.tileName === tile.name &&
              rt.tileValue === tile.value
            );
          },
        );

        if (slotToFillIx > -1) {
          // shouldn't need this if, but you never know
          activeSpell.complete[slotToFillIx] = true;
        }

        // if the spell is now complete, roll a new one
        if (activeSpell.complete.every(Boolean)) {
          state.activeSpells = [rollActiveSpell()];
        }

        // delete the tile that's now 'in' the spell
        const enspelledTile = state.tiles.findIndex((t) => t.id === tile.id);
        state.tiles.splice(enspelledTile, 1);
      }),

    setTilesToSpawn: (o: Option[]) =>
      set((state) => {
        state.tilesToSpawn = o;
      }),

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
                // tilesCanMerge(tileHere, nextPotentialTile)
                tileHere.name === nextPotentialTile.name &&
                tileHere.value === nextPotentialTile.value
              ) {
                // move the tile that's about to be deleted so that it looks good
                tileHere.position = positions.next;

                // delete the merging tiles
                const nextTileIx = state.tiles.findIndex(
                  (t) => t.id === nextPotentialTile.id,
                );
                state.tiles.splice(nextTileIx, 1);

                tileHere.position = positions.next;
                // tileHere.value = nextPotentialTile.value + tileHere.value;
                tileHere.value *= 2;

                // update the score
                state.score += tileHere.value;
              } else if (
                nextPotentialTile &&
                nextPotentialTile.type === "ENEMY" &&
                tileHere.type === "WEAPON"
              ) {
                // we have a weapon hitting an enemy; do damage
                tileHere.position = positions.farthest;
                nextPotentialTile.value -= tileHere.value;

                // also self-damage the weapon by 1
                tileHere.value -= 1;

                // delete the hit tile if its value is below 0.
                if (nextPotentialTile.value <= 0) {
                  const nextTileIx = state.tiles.findIndex(
                    (t) => t.id === nextPotentialTile.id,
                  );
                  state.tiles.splice(nextTileIx, 1);
                } // delete the hiting tile if its value is below 0.
                if (tileHere.value <= 0) {
                  const tileHereIx = state.tiles.findIndex(
                    (t) => t.id === tileHere.id,
                  );
                  state.tiles.splice(tileHereIx, 1);
                }
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
          state.tiles.push(
            addRandomTile(
              state.tiles,
              state.boardWidth,
              state.boardHeight,
              state.tilesToSpawn,
            ),
          );
        }
      }),

    resetGame: () => {
      set((state) => {
        state.score = 0;
        state.gold = 0;
        state.boardWidth = 5;
        state.boardHeight = 5;
        state.tiles = [];
        // we want to spawn these 4 specific tiles
        state.tilesToSpawn = [fireTile, waterTile, fireTile, waterTile];
        const tilesToAdd = state.tilesToSpawn.reduce((tta, option) => {
          tta.push(
            // @ts-expect-error stupid never
            addRandomTile(tta, state.boardWidth, state.boardHeight, [option]),
          );
          return tta;
        }, []);
        state.tiles = state.tiles.concat(tilesToAdd);

        // but after this, we want the spawn pool to be different... includes wildcards and 4-tiles.
        state.tilesToSpawn = elementalTiles;

        state.activeSpells = [];
        state.activeSpells.push(rollActiveSpell());
      });
    },
  })),
);

const rollActiveSpell = () => {
  const selectedSpell = spells[Math.floor(Math.random() * spells.length)];
  return {
    spell: selectedSpell,
    complete: selectedSpell.requiredTiles.map(() => false),
  };
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
