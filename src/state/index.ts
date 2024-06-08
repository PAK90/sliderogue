import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
// import chooseWeightedOption from "../helpers/chooseWeightedOption.ts";
// import { Upgrade } from "../upgrades.ts";
// import { defaultTiles } from "../tiles.ts";
import { Option } from "../helpers/chooseWeightedOption.ts";
// import { elemental4Tiles, elementalTiles } from "../data/tiles.ts";
import { rollActiveSpellData, Spell } from "../data/spells.ts";
import { Upgrade } from "../data/upgrades.ts";
import { chooseEmptyTilePosition } from "../helpers/chooseEmptyTilePosition.ts";
import { defaultDeck } from "../data/tiles.ts";
import { uniqueId } from "../helpers/uniqueId.ts";
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
export type TileUpgrades = "GOLD" | "SILVER";

export type Tile = {
  position: Coordinate;
  value: number;
  name: string;
  id: number;
  type: TileType;
  upgrades: TileUpgrades[];
};

export type BoardState = {
  tiles: Tile[];
  boardWidth: number;
  boardHeight: number;
  score: number;
  mana: number;
  gold: number;
  lines: number;
  spellsCompleted: number;
  targetScore: number;
  usedUpgrades: string[];

  deck: Option[];

  // baseTilesToSpawn: Option[];
  newTilesToSpawn: Option[];
  availableSpells: { spell: Spell; complete: boolean[] }[];
  activeSpell: number;
  draggedCells: Coordinate[];
};

export type GameState = {
  boards: BoardState[];
  choosing: boolean;
  shopping: boolean;
  upgrading: boolean;
  deckLooking: boolean;
};

export type Actions = {
  move: (direction: Direction, boardIndex?: number) => void;
  resetGame: () => void;
  setChoosing: () => void;
  toggleDeckView: () => void;
  openShopping: () => void;
  closeShopping: () => void;
  applyUpgrade: (u: Upgrade) => void;
  // setTilesToSpawn: (t: Option[]) => void;
  enspellTile: (t: Tile) => void;
  setActiveSpell: (newSpell: Spell, boardIx: number) => void;
  setDraggedPath: (c: Coordinate[], boardIndex: number) => void;
  useDraggedPath: (boardIndex: number) => void;
};

export const useGameStore = create<GameState & Actions>()(
  immer((set) => ({
    choosing: false,
    shopping: false,
    upgrading: false,
    deckLooking: false,
    boards: [],
    imminentAnnihilations: [],

    toggleDeckView: () =>
      set((state) => {
        state.deckLooking = !state.deckLooking;
      }),

    useDraggedPath: (boardIndex: number) =>
      set((state) => {
        const draggedTiles: Tile[] = [];
        state.boards[boardIndex].draggedCells.forEach((dCell) => {
          // see if we have a tile in this cell
          const potentialCell = state.boards[boardIndex].tiles.find(
            (t) => t.position.x === dCell.x && t.position.y === dCell.y,
          );

          if (potentialCell) {
            draggedTiles.push(potentialCell);
          }
        });
        // see if the active spell's requirements have been met by the dragged tiles.
        const activeSpell =
          state.boards[boardIndex].availableSpells[
            state.boards[boardIndex].activeSpell
          ];
        const satisfiesActiveSpell = activeSpell.spell.requiredTiles.every(
          (reqTile) =>
            draggedTiles.find(
              (dt) =>
                dt.name === reqTile.tileName && dt.value === reqTile.tileValue,
            ),
        );

        const percentPerTileLength = 100;

        // TODO: give points rewards for completing the active pattern.
        // congrats, the pattern was completed!
        // state.choosing = true;

        // first, delete the dragged tiles from the board
        state.boards[boardIndex].tiles = draggedTiles.reduce(
          (tileState, draggedTile) => {
            const dtIx = tileState.findIndex((t) => t.id === draggedTile.id);
            tileState.splice(dtIx, 1);
            return tileState;
          },
          state.boards[boardIndex].tiles,
        );
        // then reduce mana by the length of the dragged *cells*, not the tiles.
        state.boards[boardIndex].mana -=
          state.boards[boardIndex].draggedCells.length * 10;
        // then make the score equal to the total of dragged tiles' value multiplied by x% per cell
        // NOT equal to dragged cells; there's a difference (that a relic will probably change).
        state.boards[boardIndex].score +=
          draggedTiles.reduce((total, t) => total + t.value, 0) *
          ((draggedTiles.length * percentPerTileLength) / 100) *
          (satisfiesActiveSpell ? 2 : 1);

        const targetIncrease = 1.5;
        // state.boards[boardIndex].spellsCompleted += 1;
        // if we exceed the points total, give gold
        // give 1 gold per remaining tile on the board; keep as a reducer for future upgrades.
        if (
          state.boards[boardIndex].score >= state.boards[boardIndex].targetScore
        ) {
          state.boards[boardIndex].gold += state.boards[
            boardIndex
          ].tiles.reduce((total) => total + 1, 0);
          state.boards[boardIndex].targetScore *= targetIncrease;
          // state.boards[boardIndex].lines = 3;
          state.boards[boardIndex].score = 0;
          state.choosing = true;
        } else {
          // state.boards[boardIndex].lines--;
        }
        state.boards[boardIndex].draggedCells = [];
      }),

    setDraggedPath: (c: Coordinate[], boardIndex: number) =>
      set((state) => {
        state.boards[boardIndex].draggedCells = c;
      }),

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
        // state.boards[boardIx].newTilesToSpawn = newSpell.spawns;
        // FIXME; for now it's just me wanting each spell to have only their own colours come in.
        // state.boards[boardIx].baseTilesToSpawn = newSpell.spawns;
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

    // setTilesToSpawn: (o: Option[]) =>
    //   set((state) => {
    //     state.boards[0].baseTilesToSpawn = o;
    //   }),

    applyUpgrade: (upgrade: Upgrade) =>
      set((state) => {
        state = upgrade.stateUpdater(state);
        const timesUsed = state.boards[0].usedUpgrades.filter(
          (uu) => uu === upgrade.name,
        ).length;
        state.boards[0].gold -=
          upgrade.cost * upgrade.costMultiplier ** timesUsed;
        // take note of the upgrade used, so we can increase its cost later.
        state.boards[0].usedUpgrades.push(upgrade.name);
      }),

    openShopping: () =>
      set((state) => {
        state.shopping = true;
      }),

    closeShopping: () =>
      set((state) => {
        // const tileIndexToRemove = state.boards[0].tiles.findIndex(
        //   (t) => t.id === state.boards[0].shopping?.tileId,
        // );
        // state.boards[0].tiles.splice(tileIndexToRemove, 1);
        // state.boards[0].shopping = null;
        state.shopping = false;
      }),

    move: (direction: Direction, boardIndex = 0) =>
      set((state) => {
        if (state.choosing) return;

        let moved = false;
        if (state.boards[boardIndex].tiles.length === 0) {
          // set moved to true to pretend we have tiles so it adds another one.
          moved = true;
        }
        // build traversals
        const vector = directionMap[direction];
        const traversals = buildTraversals(
          vector,
          state.boards[boardIndex].boardWidth,
          state.boards[boardIndex].boardHeight,
        );

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

                  // update the score... and mana.
                  // state.boards[boardIndex].score += tileHere.value;
                  state.boards[boardIndex].mana += tileHere.value;
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
          // add a random tile if any are left.
          if (state.boards[boardIndex].deck.length > 0) {
            state.boards[boardIndex].tiles.push(
              // addRandomTile(
              //   state.boards[boardIndex].tiles,
              //   state.boards[boardIndex].boardWidth,
              //   state.boards[boardIndex].boardHeight,
              //   [
              //     // ...state.boards[boardIndex].baseTilesToSpawn,
              //     ...state.boards[boardIndex].newTilesToSpawn,
              //   ],
              // ),
              {
                id: uniqueId(),
                name: state.boards[boardIndex].deck[0].id.toString(),
                value: state.boards[boardIndex].deck[0].value || 2,
                position: chooseEmptyTilePosition(
                  state.boards[boardIndex].boardWidth,
                  state.boards[boardIndex].boardHeight,
                  state.boards[boardIndex].tiles,
                ).position,
                type: state.boards[boardIndex].deck[0].type,
                upgrades: [],
              },
            );
            // remove that tile from the deck
            state.boards[boardIndex].deck.splice(0, 1);
          }
          // check which parts of the required spell are complete, and mark that in the spell
          const activeSpell =
            state.boards[boardIndex].availableSpells[
              state.boards[boardIndex].activeSpell
            ];
          const newCompletedArray: boolean[] = Array.from(
            {
              length: activeSpell.complete.length,
            },
            () => false,
          );
          for (let i = 0; i < state.boards[boardIndex].tiles.length; i++) {
            const tile = state.boards[boardIndex].tiles[i];
            activeSpell.spell.requiredTiles.forEach((rt, rtIx) => {
              if (!newCompletedArray[rtIx]) {
                if (rt.tileValue === tile.value && rt.tileName === tile.name) {
                  newCompletedArray[rtIx] = true;
                }
              }
            });
          }
          activeSpell.complete = newCompletedArray;
        }

        // check for which tiles are in position to be elementally annihilated.
        // state.boards[boardIndex].imminentAnnihilations = detectAnnihilations(
        //   state.boards[boardIndex].tiles,
        // );
        // console.log(state.boards[boardIndex].imminentAnnihilations);
      }),

    resetGame: () => {
      set((state) => {
        const newSpell = rollActiveSpellData();
        const myBoard = initBoard(4, 4, newSpell, defaultDeck);
        state.boards = [myBoard];
        state.choosing = false;
      });
    },
  })),
);

// const detectAnnihilations = (tiles: Tile[]) => {
//   // for each tile, look up/down/left/right of it and see if there's a tile it will annihilate with
//   const annihilationPairs: AnnihilationPair[] = [];
//   // const checkedPos: string[] = [];
//
//   tiles.forEach((tile) => {
//     // TODO; make this not find-based...
//     const posToCheck = [];
//     const dRow = [-1, 0, 1, 0];
//     const dCol = [0, 1, 0, -1];
//     const { x, y } = tile.position;
//
//     for (let i = 0; i < 4; i++) {
//       const adjx = x + dRow[i];
//       const adjy = y + dCol[i];
//
//       if (
//         adjx >= 0 ||
//         adjy >= 0 ||
//         adjy < 5 ||
//         adjx < 5
//         // !checkedPos.includes(`${adjx}-${adjy}`)
//       ) {
//         posToCheck.push({ x: adjx, y: adjy });
//         // checkedPos.push(`${adjx}-${adjy}`);
//       }
//     }
//
//     posToCheck.forEach((pos) => {
//       const tileToCheck = tiles.find(
//         (t) => t.position.x === pos.x && t.position.y === pos.y,
//       );
//       if (tileToCheck) {
//         const collisionResults = elementsCollide(tile, tileToCheck);
//         if (collisionResults && tileToCheck.value === tile.value) {
//           annihilationPairs.push(collisionResults as AnnihilationPair);
//         }
//       }
//     });
//   });
//   return annihilationPairs;
// };

const INITIAL_TARGET = 600;

const initBoard = (
  width: number,
  height: number,
  // tilesToStart: Option[],
  // baseTilesToSpawn: Option[],
  newSpell: { spell: Spell; complete: boolean[] },
  deckOfTiles: Option[],
) => {
  const newBoardState: BoardState = {
    score: 0,
    mana: 0,
    gold: 0,
    lines: 3,
    targetScore: INITIAL_TARGET,
    spellsCompleted: 0,
    boardWidth: width,
    boardHeight: height,
    tiles: [],
    newTilesToSpawn: [],
    availableSpells: [],
    activeSpell: 0,
    draggedCells: [],
    usedUpgrades: [],
    deck: deckOfTiles,
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

  function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
  const shuffledDeck = shuffleArray(deckOfTiles);

  // const { deck, chosenTiles } = chooseTilesFromBag(deckOfTiles, 2);
  // take the given deck, shuffle it, and draw from that without ever reshuffling.

  newBoardState.tiles = startingSpots.map((ss, ssIx) => ({
    id: uniqueId(),
    name: shuffledDeck[ssIx].id.toString(),
    value: shuffledDeck[ssIx].value || 2,
    position: ss.position,
    type: shuffledDeck[ssIx].type,
    upgrades: [],
  }));

  shuffledDeck.splice(0, 2);
  newBoardState.deck = shuffledDeck;

  newBoardState.availableSpells.push(newSpell);
  return newBoardState;
};

export type AnnihilationPair = { winner: Tile; loser: Tile };
const elementsCollide = (t1: Tile, t2: Tile): AnnihilationPair | boolean => {
  // Takes in two elemental tiles and returns the winner
  // Returns false if it's not a destructive combo.
  // for now, can only annihilate within range 1.
  return false;
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
