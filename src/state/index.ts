import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
// import chooseWeightedOption from "../helpers/chooseWeightedOption.ts";
// import { Upgrade } from "../upgrades.ts";
import { addRandomTile } from "../helpers/addRandomTile.ts";
// import { defaultTiles } from "../tiles.ts";
import { Option } from "../helpers/chooseWeightedOption.ts";
import { elemental4Tiles, elementalTiles } from "../data/tiles.ts";
import { rollActiveSpellData, Spell } from "../data/spells.ts";
// import range from "../helpers/range.ts";

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
  imminentAnnihilations: AnnihilationPair[];

  baseTilesToSpawn: Option[];
  newTilesToSpawn: Option[];
  availableSpells: { spell: Spell; complete: boolean[] }[];
  activeSpell: number;
};

export type GameState = {
  boards: BoardState[];
  choosing: boolean;
};

export type Actions = {
  move: (direction: Direction, boardIndex?: number) => void;
  resetGame: () => void;
  setChoosing: () => void;
  // openShopping: (tier: string, tileId: number) => void;
  // closeShopping: () => void;
  // applyUpgrade: (u: Upgrade) => void;
  setTilesToSpawn: (t: Option[]) => void;
  enspellTile: (t: Tile) => void;
  setActiveSpell: (newSpell: Spell, boardIx: number) => void;
};

export const useGameStore = create<GameState & Actions>()(
  immer((set) => ({
    choosing: false,
    boards: [],
    imminentAnnihilations: [],

    setChoosing: () =>
      set((state) => {
        state.choosing = !state.choosing;
      }),

    setActiveSpell: (newSpell: Spell, boardIx: number) =>
      set((state) => {
        state.boards[boardIx].availableSpells[0] = {
          spell: newSpell,
          complete: newSpell.requiredTiles.map(() => false),
        };
        state.boards[boardIx].newTilesToSpawn = newSpell.spawns;
      }),

    enspellTile: (tile: Tile) =>
      set((state) => {
        const activeSpell =
          state.boards[0].availableSpells[state.boards[0].activeSpell];

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
          // shouldn't need this if statement, but you never know
          activeSpell.complete[slotToFillIx] = true;
        }

        // if the spell is now complete, let the player roll a new one
        if (activeSpell.complete.every(Boolean)) {
          // const newSpell = rollActiveSpellData();
          // state.boards[0].availableSpells = [newSpell];
          // state.boards[0].newTilesToSpawn = newSpell.spell.spawns;
          // TODO: do the spell effect
          state.choosing = true;
        }

        // delete the tile that's now 'in' the spell
        const enspelledTile = state.boards[0].tiles.findIndex(
          (t) => t.id === tile.id,
        );
        state.boards[0].tiles.splice(enspelledTile, 1);
      }),

    setTilesToSpawn: (o: Option[]) =>
      set((state) => {
        state.boards[0].baseTilesToSpawn = o;
      }),

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

              if (nextPotentialTile) {
                // we can merge in two scenarios; elemental cancellation,
                // or equal values + names (i.e. fire2 + fire2 = fire4).
                const elementalCollisionResult = elementsCollide(
                  tileHere,
                  nextPotentialTile,
                );
                if (
                  tileHere.name === nextPotentialTile.name &&
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

                  // update the score
                  state.boards[boardIndex].score += tileHere.value;
                } else if (elementalCollisionResult) {
                  // move the tile that's about to be deleted so that it looks good
                  tileHere.position = positions.next;
                  const { winner, loser } = elementalCollisionResult as {
                    winner: Tile;
                    loser: Tile;
                  };

                  if (winner.value !== loser.value) {
                    // e.g. water2 can't destroy a fire4
                    tileHere.position = positions.farthest;
                  } else {
                    // losing tile is equal or less than winner, so it has to go.
                    // delete the losing tile
                    const losingTileIx = state.boards[
                      boardIndex
                    ].tiles.findIndex((t) => t.id === loser.id);
                    state.boards[boardIndex].tiles.splice(losingTileIx, 1);

                    tileHere.position = positions.next;

                    // if (winner.value === loser.value) {
                    //   // the winner also gets destroyed
                    //   const winningTileIx = state.boards[boardIndex].tiles.findIndex(
                    //     (t) => t.id === winner.id,
                    //   );
                    //   state.boards[boardIndex].tiles.splice(winningTileIx, 1);
                    // }
                  }

                  // update the score
                  state.boards[boardIndex].score += tileHere.value;
                } else {
                  // no elemental collision, just move the current tile along.
                  tileHere.position = positions.farthest;
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
          state.boards[boardIndex].tiles.push(
            addRandomTile(
              state.boards[boardIndex].tiles,
              state.boards[boardIndex].boardWidth,
              state.boards[boardIndex].boardHeight,
              [
                ...state.boards[boardIndex].baseTilesToSpawn,
                ...state.boards[boardIndex].newTilesToSpawn,
              ],
            ),
          );
        }

        // check for which tiles are in position to be elementally annihilated.
        state.boards[boardIndex].imminentAnnihilations = detectAnnihilations(
          state.boards[boardIndex].tiles,
        );
        console.log(state.boards[boardIndex].imminentAnnihilations);
      }),

    resetGame: () => {
      set((state) => {
        const myBoard = initBoard(5, 5, elementalTiles, elemental4Tiles);
        // const enemyBoard = initBoard(5, 5, elementalTiles, elementalTiles);
        state.boards = [myBoard];
        state.choosing = false;
      });
    },
  })),
);

const detectAnnihilations = (tiles: Tile[]) => {
  // for each tile, look up/down/left/right of it and see if there's a tile it will annihilate with
  const annihilationPairs: AnnihilationPair[] = [];
  const checkedPos: string[] = [];

  tiles.forEach((tile) => {
    // TODO; make this not find-based...
    const posToCheck = [];
    const dRow = [-1, 0, 1, 0];
    const dCol = [0, 1, 0, -1];
    const { x, y } = tile.position;

    for (let i = 0; i < 4; i++) {
      const adjx = x + dRow[i];
      const adjy = y + dCol[i];

      if (
        (adjx >= 0 || adjy >= 0 || adjy < 5 || adjx < 5) &&
        !checkedPos.includes(`${adjx}-${adjy}`)
      ) {
        posToCheck.push({ x: adjx, y: adjy });
        checkedPos.push(`${adjx}-${adjy}`);
      }
    }

    posToCheck.forEach((pos) => {
      const tileToCheck = tiles.find(
        (t) => t.position.x === pos.x && t.position.y === pos.y,
      );
      if (tileToCheck) {
        const collisionResults = elementsCollide(tile, tileToCheck);
        if (collisionResults && tileToCheck.value === tile.value) {
          annihilationPairs.push(collisionResults as AnnihilationPair);
        }
      }
    });
  });
  return annihilationPairs;
};

const initBoard = (
  width: number,
  height: number,
  tilesToStart: Option[],
  baseTilesToSpawn: Option[],
) => {
  const newSpell = rollActiveSpellData();
  const newBoardState: BoardState = {
    score: 0,
    imminentAnnihilations: [],
    boardWidth: width,
    boardHeight: height,
    tiles: [],
    baseTilesToSpawn: tilesToStart,
    newTilesToSpawn: newSpell.spell.spawns,
    availableSpells: [],
    activeSpell: 0,
  };
  const tilesToAdd = newBoardState.baseTilesToSpawn.reduce((tta, option) => {
    tta.push(
      // @ts-expect-error stupid never
      addRandomTile(tta, newBoardState.boardWidth, newBoardState.boardHeight, [
        option,
      ]),
    );
    return tta;
  }, []);
  newBoardState.tiles = newBoardState.tiles.concat(tilesToAdd);

  // but after this, we want the spawn pool to be different... includes wildcards and 4-tiles.
  newBoardState.baseTilesToSpawn = baseTilesToSpawn;

  newBoardState.availableSpells.push(newSpell);
  return newBoardState;
};

export type AnnihilationPair = { winner: Tile; loser: Tile };
const elementsCollide = (t1: Tile, t2: Tile): AnnihilationPair | boolean => {
  // Takes in two elemental tiles and returns the winner
  // Returns false if it's not a destructive combo.
  // for now, can only annihilate within range 1.
  if (
    Math.abs(t1.position.x - t2.position.x) === 1 ||
    Math.abs(t1.position.y - t2.position.y) === 1
  ) {
    const winningMap = {
      F: "A",
      A: "E",
      E: "W",
      W: "F",
    };
    // @ts-expect-error don't know how to fix
    if (winningMap[t1.name] === t2.name) {
      return { winner: t1, loser: t2 };
      // @ts-expect-error don't know how to fix
    } else if (winningMap[t2.name] === t1.name) {
      return { winner: t2, loser: t1 };
    }
  }
  return false;
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
