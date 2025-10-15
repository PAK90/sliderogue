import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
// import chooseWeightedOption from "../helpers/chooseWeightedOption.ts";
// import { Upgrade } from "../upgrades.ts";
// import { defaultTiles } from "../tiles.ts";
import { Option } from "../helpers/chooseWeightedOption.ts";
// import { elemental4Tiles, elementalTiles } from "../data/tiles.ts";
import { Spell, spells } from "../data/spells.ts";
import {
  TileUpgrades,
  Upgrade,
  UpgradeDominance,
  TileUpgradesDominance,
} from "../data/upgrades.ts";
import { Item } from "../data/items.ts";
import { chooseEmptyTilePosition } from "../helpers/chooseEmptyTilePosition.ts";
import { uniqueId } from "../helpers/uniqueId.ts";
import shuffleArray from "../helpers/shuffleArray.ts";
import {
  createEnemy,
  Enemy,
  GolbinEnemy,
  ShielderEnemy,
} from "../data/enemies.ts";
import { BASE_MANA_COST, BASE_MANA_MULTIPLIER } from "../data/constants.ts";
import range from "../helpers/range.ts";
import {
  findPatternIndicesByName,
  parseFactor,
} from "../helpers/patternMatcher.ts";
import {
  addEffectInternal,
  commitSlideInternal,
  removeEffectInternal,
} from "../data/effects.ts";
import { flyTileToSpell } from "../helpers/flyToSpell.ts";
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

export type EffectId = string;
export type EffectName = "Block" | "Poison" | "Burn" | "Freeze";
export type EntityId = string;

export interface Entity {
  id: EntityId;
  name: string;
  currentHealth: number;
  maxHealth: number;
  kind: string;
}

export interface EffectInstance {
  id: EffectId;
  name: EffectName;
  target: EntityId;
  source?: EntityId;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>; // per-effect state, e.g. { amount: 12 } or { stacks: 7 }
  expiresAtSlide?: number; // inclusive (expires when state.slide >= expiresAtSlide)
  priority?: number; // higher runs first in pipelines (default 0)
}

export interface DamageCtx {
  target: EntityId;
  amount: number; // mutable; effects can reduce/modify
  tags?: string[]; // e.g. ["poison","hp_loss"]
}

export type EffectDef = {
  modifyIncomingDamage?: (
    state: GameState,
    self: EffectInstance,
    ctx: DamageCtx,
  ) => void;
  onExpire?: (state: GameState, self: EffectInstance) => void;
  onSlideEnd?: (state: GameState, self: EffectInstance) => void;

  // NEW: run before removal; return true to PREVENT death (e.g., Grit/Undying)
  onBeforeDeath?: (
    state: GameState,
    self: EffectInstance,
    evt: DeathEvent,
  ) => boolean | void;

  // NEW: run when an entity dies (deathrattles, soul orbs, etc.)
  onDeath?: (state: GameState, self: EffectInstance, evt: DeathEvent) => void;

  suppressAbilityTick?: (
    state: GameState,
    self: EffectInstance,
    enemyId: EntityId,
  ) => boolean;

  // --- NEW: display metadata ---
  label?: string; // "Block"
  short?: string; // "BLK"
  getValue?: (self: EffectInstance) => number | null | undefined; // canonical “magnitude”
  format?: (self: EffectInstance, state?: GameState) => string; // final string
};

export type DeathEvent = {
  entityId: EntityId;
  cause: "damage" | "poison" | "effect" | "script";
  amount?: number; // last chunk that set HP <= 0
  tags?: string[]; // pass-through tags (e.g., ["poison"])
};

export type Tile = {
  position: Coordinate;
  value: number;
  name: string;
  id: EntityId;
  fromLine: boolean;
  type: TileType;
  upgrades: TileUpgrades[];
};

export const isPlayer = (e: Player | Enemy): e is Enemy => e.kind === "player";

export interface Player extends Entity {
  knownSpells: Spell[];
  chosenSpells: { spell: Spell; complete: (false | Tile)[] }[];
  baseTileBag: Option[];
  // buffs: Buff[];
  kind: "player";
  gold: number;
}

export type BoardState = {
  tiles: Tile[];
  boardWidth: number;
  boardHeight: number;
  score: number;
  mana: number;
  lines: number;
  spellsCompleted: number;
  targetScore: number;
  usedUpgrades: string[];
  ownedItems: string[];
  selectedTiles: Tile[];
  selectedDeckTiles: number[];
  lockedTileNames: string[];
  numberOfSlides: number;

  basePoints: number;
  multiplier: number;

  usableDeck: Option[];
  upgradedDeck: Option[];
  temporaryDeck: Option[];

  // baseTilesToSpawn: Option[];
  // newTilesToSpawn: Option[];
  // availableSpells: { spell: Spell; complete: boolean[] }[];
  // activeSpell: number;
  draggedCells: Coordinate[];
  imminentAnnihilations: AnnihilationPair[];
};

export type GameState = {
  player: Player;
  boards: BoardState[];
  activeWave: number;
  waves: Enemy[][];
  defeatedEnemies: Enemy[];
  choosing_old: boolean;
  choosingSpells: boolean;
  chosenTargets: number[];
  spellsToTarget: { spell: Spell; draggedTiles: Tile[] }[];
  satisfiedSpells: (Tile[] | null)[];
  shopping: boolean;
  upgrading: false | Upgrade;
  deckLooking: boolean;
  targeting: boolean;

  // HYBRID: global instances + per-target index
  effects: Record<EffectId, EffectInstance>;
  effectsByTarget: Record<EntityId, EffectId[]>;

  // trying to have both player and enemies here
  entities: Record<EntityId, Player | Enemy>;
  enemyAbilityCD: Record<EntityId, number[]>; // per-enemy array aligned with enemy.abilities
};

export type Actions = {
  move: (direction: Direction, boardIndex?: number) => void;
  resetGame: () => void;
  setChoosing: () => void;
  setUpgrading: (u: Upgrade) => void;
  endUpgrading: () => void;
  toggleDeckView: () => void;
  openShopping: () => void;
  closeShopping: () => void;
  setLockedTileNames: (l: string[]) => void;
  applyUpgrade: (u: Upgrade | Item) => void;
  // setTilesToSpawn: (t: Option[]) => void;
  enspellTile: (t: Tile) => void;
  // setActiveSpell: (newSpells: Spell[], boardIx: number) => void;
  setDraggedPath: (c: Coordinate[], boardIndex: number) => void;
  useDraggedPath: (boardIndex: number) => void;
  setSelectedTiles: (t: Tile, bIx: number) => void;
  setSelectedDeckTiles: (t: number, bIx: number) => void;
  toggleTargeting: () => void;
  submitTargetsToSpell: () => void;
  setChosenTargets: (t: number) => void;
  defeatEnemy: (e: Enemy) => void;
  castReadySpells: () => void;

  setChosenSpells: (spells: Spell[]) => void;

  addEffect: (
    target: EntityId,
    name: EffectName,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Record<string, any>,
    opts?: {
      durationSlides?: number;
      priority?: number;
      stacking?: "add" | "refresh" | "replace";
    },
  ) => EffectId;
  removeEffect: (id: EffectId) => void;
  // dealDamage: (targetId: EntityId, base: number, tags?: string[]) => void;
  // commitSlide: () => void;
};

export const useGameStore = create<GameState & Actions>()(
  immer((set) => ({
    choosing_old: false,
    choosingSpells: true,
    shopping: false,
    upgrading: false,
    deckLooking: false,
    targeting: false,
    boards: [],
    chosenTargets: [],
    spellsToTarget: [],
    satisfiedSpells: [],
    activeWave: 0,
    waves: [
      [createEnemy(GolbinEnemy, 0, "a"), createEnemy(GolbinEnemy, 1, "z")],
      [
        createEnemy(ShielderEnemy, 0, ""),
        createEnemy(GolbinEnemy, 1, "a"),
        createEnemy(GolbinEnemy, 2, "z"),
      ],
    ],
    defeatedEnemies: [],
    player: {
      maxHealth: 50,
      currentHealth: 50,
      // TODO; move this to a choosing UI that presents all of the starter spells
      // TODO: for now we prechoose two from the spells file.
      // chosenSpells: spells.map((s) => ({
      //   spell: s,
      //   complete: s.requiredTiles.map(() => false),
      // })),
      chosenSpells: [], // will be set by choosing UI.
      knownSpells: spells,
      baseTileBag: [], // to be filled in once the player chooses spells
      kind: "player",
      id: "PLAYER",
      name: "Sir Bearington",
      gold: 0,
    },
    imminentAnnihilations: [],

    effects: {},
    effectsByTarget: {},
    enemyAbilityCD: {},

    entities: {},

    setChosenSpells: (spells: Spell[]) =>
      set((state) => {
        state.choosingSpells = false;
        state.player.chosenSpells = spells.map((s) => ({
          spell: s,
          complete: s.requiredTiles.map(() => false),
        }));

        const TOTAL_TILE_NUM = 24;
        const elementsFromSpells = spells.reduce<string[]>(
          (elements, spell) => {
            const allSpellElements = [
              ...new Set(spell.requiredTiles.map((rt) => rt.tileName)),
            ];
            return [...new Set([...elements, ...allSpellElements])];
          },
          [],
        );
        const tilesFromSpells = elementsFromSpells
          .map((element) => {
            return range(
              TOTAL_TILE_NUM / elementsFromSpells.length,
              element,
            ).map((el) => {
              return {
                name: el,
                weight: 100,
                type: "ELEMENTAL",
                fromLine: false,
              } as Option;
            });
          })
          .flat();

        // const myBoard = initBoard(4, 4, newSpell, defaultDeck);
        const myBoard = initBoard(
          4,
          4,
          // allSpawns,
          // allSpawns,
          // newSpell, // TODO: remove this just one spell here
          // allSpawns
          //   .map((st) =>
          //     Array.from({ length: 25 }, () => ({
          //       ...st,
          //     })),
          //   )
          //   .flat(),
          tilesFromSpells,
        );

        state.player.baseTileBag = tilesFromSpells;
        state.boards = [myBoard];
      }),

    setSelectedTiles: (t: Tile, bIx: number) =>
      set((state) => {
        // state.boards[bIx].selectedTiles = t;
        const board = state.boards[bIx];
        const selectedAlreadyIx = board.selectedTiles.findIndex(
          (st) => st.id === t.id,
        );
        if (selectedAlreadyIx !== -1) {
          board.selectedTiles.splice(selectedAlreadyIx, 1);
        } else {
          board.selectedTiles.push(t);
        }
      }),

    setSelectedDeckTiles: (deckTileIndex: number, bIx: number) =>
      set((state) => {
        const board = state.boards[bIx];
        const selectedAlreadyIx = board.selectedDeckTiles.findIndex(
          (st) => st === deckTileIndex,
        );
        if (selectedAlreadyIx !== -1) {
          board.selectedDeckTiles.splice(selectedAlreadyIx, 1);
        } else {
          board.selectedDeckTiles.push(deckTileIndex);
        }
      }),

    setUpgrading: (u: Upgrade) =>
      set((state) => {
        state.upgrading = u;
        // state.shopping = false;
        state.deckLooking = true;
      }),

    endUpgrading: () =>
      set((state) => {
        state.upgrading = false;
        state.boards[0].selectedTiles = [];
        state.boards[0].selectedDeckTiles = [];
      }),

    toggleDeckView: () =>
      set((state) => {
        state.deckLooking = !state.deckLooking;
      }),

    defeatEnemy: (enemy: Enemy) => {
      set((state) => {
        // remove the enemy from active state.enemies array
        // add it to the state.defeatedEnemies array for loot purposes once the round ends.
        const boardState = state.boards[0];
        const { player } = state;
        const enemies = state.waves[state.activeWave];
        const enemyIx = enemies.findIndex((e) => e.id === enemy.id);
        if (enemyIx !== -1) {
          enemies.splice(enemyIx, 1);
          state.defeatedEnemies = state.defeatedEnemies.concat(enemy);
        } else {
          console.warn("No enemy found when trying to remove;", enemy, enemies);
        }
        if (enemies.length === 0) {
          window.alert("yay you defeated all the enemies!");
          // TODO: move on to next round, first drop loot though, and let player buy upgrades.
          state.activeWave++;

          // reset slide counter!
          boardState.numberOfSlides = 0;
          console.log("board state for deck inspection: ", boardState);
          if (state.activeWave > state.waves.length - 1) {
            window.alert("w00t you beat the game!");
          } else {
            // drop some tasty loot
            state.defeatedEnemies.forEach((defeatedEnemy) => {
              // TODO; genericise this
              // boardState.gold += defeatedEnemy.loot.reduce(
              //   (totalGold, loot) => {
              //     if (loot.type === "GOLD") {
              //       totalGold += loot.quantity;
              //     }
              //     return totalGold;
              //   },
              //   0,
              // );
            });
            state.shopping = true;
            state.defeatedEnemies = [];
          }

          // make any tiles used for spells be added to the base deck for the next round
          // const allSpawns = spells.reduce<Option[]>((mergedSpawns, spell) => {
          //   return [...mergedSpawns, ...spell.spawns];
          // }, []);
          // const deckFromSpawns = allSpawns
          //   .map((st) => Array.from({ length: 25 }, () => ({ ...st })))
          //   .flat();
          // boardState.upgradedDeck = boardState.upgradedDeck.concat(
          //   boardState.temporaryDeck,
          // );
          boardState.usableDeck = shuffleArray(player.baseTileBag);
          // boardState.temporaryDeck = [];

          // clear board, start new round!
          boardState.tiles = [];
          boardState.mana = 0;
        }
      });
    },

    castReadySpells: () =>
      set((state) => {
        const boardState = state.boards[0];
        const { player } = state;
        const activeSpells = player.chosenSpells;

        activeSpells.forEach((activeSpell, asIx) => {
          if (
            activeSpell.complete.every((v) => !!v) &&
            activeSpell.spell.manaCost <= boardState.mana
          ) {
            // spend the mana FIRST before doing effect, since setting mana to 0
            // happens in the damage effect.
            console.log("casting spell", activeSpell.spell.name);
            boardState.mana -= activeSpell.spell.manaCost;

            if (
              activeSpell.spell.targets === "ENEMY" &&
              activeSpell.spell.targetQuantity > 0
            ) {
              state.targeting = true;
              state.spellsToTarget = state.spellsToTarget.concat({
                spell: activeSpell.spell,
                draggedTiles: activeSpell.complete as Tile[],
              });
            } else {
              activeSpell.spell.stateUpdater(
                [0],
                state,
                activeSpell.complete as Tile[],
              );
            }
            // reset the spell
            activeSpell.complete = activeSpells[asIx].spell.requiredTiles.map(
              () => false,
            );
          }
        });
      }),

    useDraggedPath: (boardIndex: number) =>
      set((state) => {
        const draggedTiles: Tile[] = [];
        const boardState = state.boards[boardIndex];
        boardState.draggedCells.forEach((dCell) => {
          // see if we have a tile in this cell
          const potentialCell = boardState.tiles.find(
            (t) => t.position.x === dCell.x && t.position.y === dCell.y,
          );

          if (potentialCell) {
            draggedTiles.push(potentialCell);
          }
        });
        // see if the active spell's requirements have been met by the dragged tiles.
        const activeSpells = state.player.chosenSpells;
        // const satisfiedActiveSpells = activeSpells.map((activeSpell) => {
        //   // return activeSpell.spell.requiredTiles.every((reqTile) =>
        //   //   draggedTiles.find(
        //   //     (dt) =>
        //   //       dt.name === reqTile.tileName && dt.value === reqTile.tileValue,
        //   //   ),
        //   // );
        //   //  split by tile colours, right now all spells are mono-colour so it doesn't matter... yet.
        //   // const patternIndices = findPatternIndices(
        //   //   draggedTiles.map((dt) => dt.value),
        //   //   activeSpell.spell.requiredTiles.map((rt) => rt.tileValue as string),
        //   // );
        //   const patternIndices = findPatternIndicesByName(
        //     draggedTiles,
        //     activeSpell.spell.requiredTiles,
        //   );
        //   if (patternIndices) {
        //     return patternIndices.map((pIx) => draggedTiles[pIx]);
        //   }
        //   return null;
        // });

        // this is mostly so that spell effects can access tile value data without having
        // to run this calc themselves; NOT REQUIRED ANYMORE since we just pass in the tiles right away
        // state.satisfiedSpells = satisfiedActiveSpells;

        // const percentPerTileLength = 100;
        // const baseManaCostPerTile = 10;
        // const manaIncreasePerTile = 1.1;

        // first, reduce mana by the length of the dragged *cells*, not the tiles.
        boardState.mana -= boardState.draggedCells.reduce(
          (manaTotal, dTile, dTileIx) => {
            const draggedTile = boardState.tiles.find(
              (t) => t.position.x === dTile.x && t.position.y === dTile.y,
            );
            return Math.floor(
              manaTotal +
                BASE_MANA_COST *
                  BASE_MANA_MULTIPLIER ** dTileIx *
                  (draggedTile?.upgrades.includes("SILVER") ? 0.5 : 1),
            );
          },
          0,
        );

        // then, add the dragged tiles randomly to the temporary deck (that will be merged to defaultDeck later)
        boardState.temporaryDeck = draggedTiles.reduce(
          (tempDeckState, draggedTile) => {
            // only add tiles that have been modified after being saved and then re-spawned
            if (!draggedTile.fromLine) {
              tempDeckState.splice(
                Math.floor(Math.random() * tempDeckState.length),
                0,
                {
                  weight: 100,
                  type: draggedTile.type,
                  value: draggedTile.value,
                  fromLine: true,
                  name: draggedTile.name,
                  upgrades: draggedTile.upgrades,
                },
              );
            }
            return tempDeckState;
          },
          boardState.temporaryDeck,
        );

        // then, delete the dragged tiles from the board
        const toDeleteTiles: Tile[] = [];
        boardState.tiles = draggedTiles.reduce((tileState, draggedTile) => {
          const dtIx = tileState.findIndex((t) => t.id === draggedTile.id);
          if (dtIx !== -1) {
            // if (tileState[dtIx].upgrades.includes("EXPLOSIVE")) {
            //   // delete the tiles above, below and to either side of this one too
            //   [
            //     [1, 0],
            //     [-1, 0],
            //     [0, 1],
            //     [0, -1],
            //   ].forEach((d) => {
            //     const adjTile = tileState.find(
            //       (t) =>
            //         t.position.x === tileState[dtIx].position.x + d[0] &&
            //         t.position.y === tileState[dtIx].position.y + d[1],
            //     );
            //     if (adjTile) {
            //       toDeleteTiles.push(adjTile);
            //     }
            //   });
            // }
            tileState.splice(dtIx, 1);
          }
          return tileState;
        }, boardState.tiles);
        boardState.tiles = toDeleteTiles.reduce((tileState, toDeleteTile) => {
          const dtIx = tileState.findIndex((t) => t.id === toDeleteTile.id);
          tileState.splice(dtIx, 1);
          return tileState;
        }, boardState.tiles);
        // then make the score equal to the total of dragged tiles' value multiplied by x% per cell
        // NOT equal to dragged cells; there's a difference (that a relic will probably change).
        // boardState.score +=
        //   draggedTiles.reduce((total, t) => total + t.value, 0) *
        //   ((draggedTiles.length * percentPerTileLength) / 100) *
        //   (satisfiesActiveSpell ? 2 : 1);
        // calculate the score using the state-provided numbers, since we can
        boardState.score += boardState.multiplier * boardState.basePoints; /* *
          (satisfiesActiveSpell ? 2 : 1);*/

        // do spell effects
        state.satisfiedSpells.forEach((sat, satIx) => {
          if (sat) {
            if (activeSpells[satIx].spell.targets === "ENEMY") {
              // TODO: targeting!
              state.targeting = true;
              state.spellsToTarget = state.spellsToTarget.concat({
                spell: activeSpells[satIx].spell,
                draggedTiles: sat,
              });
            } else {
              state = activeSpells[satIx].spell.stateUpdater([0], state, sat);
            }
          }
        });
        console.log("activated spell state updaed", state.spellsToTarget);

        // re-calculate annihilation pairs after possibly removing tiles with the Line
        // TODO: re-enable annihilations once I figure out how to do them in slide-only mode
        // boardState.imminentAnnihilations = detectAnnihilations(
        //   boardState.tiles,
        // );

        const targetIncrease = 1.5;
        // state.boards[boardIndex].spellsCompleted += 1;
        // if we exceed the points total, give gold
        if (boardState.score >= boardState.targetScore) {
          // give 1 gold per remaining tile on the board; 3 if it's a gold tile.
          // boardState.gold += boardState.tiles.reduce(
          //   (total, tile) => total + (tile.upgrades.includes("GOLD") ? 3 : 1),
          //   0,
          // );
          // increase the target score
          boardState.targetScore = Math.floor(
            boardState.targetScore * targetIncrease,
          );

          // reset things
          boardState.lines = 99;
          boardState.score = 0;
          state.choosing_old = true;
          // clear the board of tiles after completion?
          boardState.tiles = [];
          boardState.mana = 0;
        } else {
          boardState.lines--;
        }
        boardState.draggedCells = [];
        boardState.multiplier = 0;
        boardState.basePoints = 0;
      }),

    submitTargetsToSpell: () =>
      set((state) => {
        // take the first spell with targets on the 'stack' and resolve it
        // it should always be the 0th since we concat them on, and will slice this one off after.
        const targets = state.chosenTargets;
        const { spell, draggedTiles } = state.spellsToTarget[0];
        state = spell.stateUpdater(targets, state, draggedTiles);
        state.spellsToTarget.splice(0, 1);
        state.chosenTargets = []; // reset the targeting.
        if (state.spellsToTarget.length === 0) {
          state.targeting = false;
        }
      }),

    setChosenTargets: (target: number) =>
      // TODO: cap the number of chosen to the spell's target number cap
      set((state) => {
        const existingTargetIx = state.chosenTargets.findIndex(
          (t) => t === target,
        );
        if (existingTargetIx !== -1) {
          state.chosenTargets.splice(existingTargetIx, 1);
        } else {
          state.chosenTargets = state.chosenTargets.concat(target);
        }
        console.log("targets: ", state.chosenTargets);
      }),

    setDraggedPath: (c: Coordinate[], boardIndex: number) =>
      set((state) => {
        const boardState = state.boards[boardIndex];

        // update dragged cell state
        boardState.draggedCells = c;

        // calculate dragged tiles
        const draggedTiles: Tile[] = [];
        c.forEach((dCell) => {
          // see if we have a tile in this cell
          const potentialCell = boardState.tiles.find(
            (t) => t.position.x === dCell.x && t.position.y === dCell.y,
          );

          if (potentialCell) {
            draggedTiles.push(potentialCell);
          }
        });
        // console.log("draggedTiles: ", draggedTiles);

        // calculate the base and multipliers here
        // const calculateScoreBits = (c: Coordinate[]) => {
        //   const { tileScore, length } = c.reduce(
        //     (scoreParts, cell) => {
        //       const cellTile = tiles.find(
        //         (t) => t.position.x === cell.x && t.position.y === cell.y,
        //       );
        //       if (cellTile) {
        //         return {
        //           tileScore: scoreParts.tileScore + cellTile.value,
        //           length: scoreParts.length + 1,
        //         };
        //       }
        //       return scoreParts;
        //     },
        //     { tileScore: 0, length: 0 },
        //   );
        //   return { tileScore, length };
        // };
        // const oldScore = calculateScoreBits(boardState.draggedCells);
        // const newScore = calculateScoreBits(c);

        // see if the active spell's requirements have been met by the dragged tiles.
        const activeSpells = state.player.chosenSpells;
        const satisfiedActiveSpells = activeSpells.map((activeSpell) => {
          const patternIndices = findPatternIndicesByName(
            draggedTiles,
            activeSpell.spell.requiredTiles,
          );
          if (patternIndices) {
            return patternIndices.map((pIx) => draggedTiles[pIx]);
          }
          return null;
        });

        state.satisfiedSpells = satisfiedActiveSpells;

        // TODO: also include effects from patterns here
        // boardState.multiplier += newScore.length - oldScore.length;
        // boardState.basePoints += newScore.tileScore - oldScore.tileScore;
      }),

    setChoosing: () =>
      set((state) => {
        state.choosing_old = !state.choosing_old;
      }),

    // setActiveSpell: (newSpell: Spell, boardIx: number) =>
    //   set((state) => {
    //     const boardState = state.boards[boardIx];
    //     boardState.availableSpells[0] = {
    //       spell: newSpell,
    //       complete: newSpell.requiredTiles.map(() => false),
    //     };
    //     boardState.newTilesToSpawn = newSpell.spawns;
    //     // FIXME; for now it's just me wanting each spell to have only their own colours come in.
    //     boardState.baseTilesToSpawn = newSpell.spawns;
    //
    //     // prototype; make deck tiles equal to spawns on the spell, plus the temporary deck.
    //     const deckFromSpawns = newSpell.spawns
    //       .map((st) => Array.from({ length: 25 }, () => ({ ...st })))
    //       .flat();
    //     boardState.upgradedDeck = boardState.upgradedDeck.concat(
    //       boardState.temporaryDeck,
    //     );
    //     boardState.usableDeck = shuffleArray(
    //       deckFromSpawns.concat(boardState.upgradedDeck),
    //     );
    //     boardState.temporaryDeck = [];
    //   }),

    enspellTile: (tile: Tile) =>
      set((state) => {
        console.log("ENSPELLING");
        // FIXME: this isn't being called by anything it seems
        const activeSpell = state.player.chosenSpells[0];

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
          activeSpell.complete[slotToFillIx] = tile;
        }

        // if the spell is now complete, let the player roll a new one
        if (activeSpell.complete.every(Boolean)) {
          // const newSpell = rollActiveSpellData();
          // state.boards[0].availableSpells = [newSpell];
          // state.boards[0].newTilesToSpawn = newSpell.spell.spawns;
          state.choosing_old = true;
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

    applyUpgrade: (upgrade: Upgrade | Item) =>
      set((state) => {
        state = upgrade.stateUpdater(state);
        // const timesUsed = state.boards[0].usedUpgrades.filter(
        //   (uu) => uu === upgrade.name,
        // ).length;
        state.player.gold -= upgrade.cost;
        // take note of the upgrade used, so we can increase its cost later.
        if (upgrade.type === "ITEM") {
          state.boards[0].ownedItems.push(upgrade.name);
        } else {
          state.boards[0].usedUpgrades.push(upgrade.name);
        }
      }),

    setLockedTileNames: (lockedNames: string[]) =>
      set((state) => {
        state.boards[0].lockedTileNames = lockedNames;
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
        if (state.choosing_old) return;

        let moved = false;
        const boardState = state.boards[boardIndex];
        if (boardState.tiles.length === 0) {
          // empty board; set moved to true to pretend we have tiles, so it adds another one.
          moved = true;
        }
        // build traversals
        const vector = directionMap[direction];
        const traversals = buildTraversals(
          vector,
          boardState.boardWidth,
          boardState.boardHeight,
        );

        const activeSpells = state.player.chosenSpells;

        traversals.x.forEach((xTrav) => {
          traversals.y.forEach((yTrav) => {
            const currentCell = { x: xTrav, y: yTrav };

            const tileHere = boardState.tiles.find(
              (t) =>
                t.position.x === currentCell.x &&
                t.position.y === currentCell.y,
            );

            if (
              tileHere &&
              !boardState.lockedTileNames.includes(tileHere.name)
            ) {
              const positions = findFarthestPosition(
                currentCell,
                vector,
                boardState.tiles,
                boardState.boardWidth,
                boardState.boardHeight,
              );

              const nextPotentialTile = boardState.tiles.find(
                (t) =>
                  t.position.x === positions.next.x &&
                  t.position.y === positions.next.y,
              );

              if (nextPotentialTile) {
                // we can merge in two scenarios; elemental cancellation,
                // or equal values + names (i.e. fire2 + fire2 = fire4).
                // TODO: re-enable this annihilation calc when we figure out how to use it without line
                const elementalCollisionResult = false;
                // const elementalCollisionResult = elementsCollide(
                //   tileHere,
                //   nextPotentialTile,
                // );
                if (
                  tileHere.name === nextPotentialTile.name &&
                  tileHere.value === nextPotentialTile.value
                ) {
                  // move the tile that's about to be deleted so that it looks good
                  tileHere.position = positions.next;

                  // combine the upgrades on both tiles.
                  // if the upgrade has upgradeDominance of DOMINANT, then if tile A has it and tile B doesn't,
                  // then the resulting tile will have it.
                  // if the upgrade has upgradeDominance of RECESSIVE, then if tile A has it and tile B doesn't,
                  // then the resulting tile will not have it.
                  const combinedUpgrades = Array.from(
                    new Set(
                      tileHere.upgrades.concat(nextPotentialTile.upgrades),
                    ),
                  );
                  combinedUpgrades.filter((upgrade) => {
                    if (
                      UpgradeDominance[upgrade] ===
                      TileUpgradesDominance.DOMINANT
                    )
                      return true;
                    else {
                      // must be recessive, so return true/false depending on whether the upgrade is on both tiles.
                      return (
                        tileHere.upgrades.includes(upgrade) &&
                        nextPotentialTile.upgrades.includes(upgrade)
                      );
                    }
                  });

                  // delete the merging tiles
                  const nextTileIx = boardState.tiles.findIndex(
                    (t) => t.id === nextPotentialTile.id,
                  );
                  boardState.tiles.splice(nextTileIx, 1);

                  tileHere.position = positions.next;
                  tileHere.value *= 2;
                  tileHere.upgrades = combinedUpgrades;
                  // set the tile to now be 'aged', i.e. it can show up again
                  // in the tile deck/bag, since it now has a new value.
                  tileHere.fromLine = false;

                  // NOW; let's see if any spells exist for which this tile satisfies a requirement
                  let satisfiedTile = false;
                  activeSpells.forEach((spell) => {
                    spell.spell.requiredTiles.forEach(
                      (spellRequiredTile, srqIx) => {
                        if (
                          spellRequiredTile.tileName === tileHere.name &&
                          !satisfiedTile &&
                          !spell.complete[srqIx]
                        ) {
                          // we match the colour/element, now we need to check the values...
                          // if no slots have been completed yet, we can take any value
                          if (spell.complete.every((v) => !v)) {
                            spell.complete[0] = tileHere;
                            satisfiedTile = true;
                          } else {
                            // assuming first spell required tile is 'x',
                            // let's take that requiredValue and find the other required values
                            const existingTile = spell.complete[0];
                            // FIXME: this needs to work with numbers too.
                            if (existingTile) {
                              const requiredValue =
                                parseFactor(
                                  spellRequiredTile.tileValue as string,
                                ) * existingTile.value;
                              if (requiredValue === tileHere.value) {
                                satisfiedTile = true;
                                spell.complete[srqIx] = tileHere;
                              }
                            }
                          }
                        }
                      },
                    );
                    // if after all this, the spell is all complete, cast it and reset it
                    // if (spell.complete.every((v) => !!v)) {
                    //   if (spell.spell.targets === "ENEMY") {
                    //     state.targeting = true;
                    //     state.spellsToTarget = state.spellsToTarget.concat({
                    //       spell: spell.spell,
                    //       draggedTiles: spell.complete as Tile[],
                    //     });
                    //   } else {
                    //     state = spell.spell.stateUpdater(
                    //       [0],
                    //       state,
                    //       spell.complete as Tile[],
                    //     );
                    //   }
                    //   spell.complete = spell.spell.requiredTiles.map(
                    //     () => false,
                    //   );
                    // }
                  });

                  // update the score... and mana.
                  // state.boards[boardIndex].score += tileHere.value;
                  const manaMultiplier = combinedUpgrades.includes("SILVER")
                    ? 1.2
                    : 1;
                  boardState.mana += Math.floor(
                    tileHere.value * manaMultiplier,
                  );

                  // if the tile was used for a spell, remove it
                  if (satisfiedTile) {
                    const tileHereIx = boardState.tiles.findIndex(
                      (t) => t.id === tileHere.id,
                    );
                    boardState.tiles.splice(tileHereIx, 1);
                    flyTileToSpell(tileHere.id, 0);
                  }
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
                    const losingTileIx = boardState.tiles.findIndex(
                      (t) => t.id === loser.id,
                    );
                    boardState.tiles.splice(losingTileIx, 1);

                    // tileHere.position = positions.next;

                    // if (winner.value === loser.value) {
                    // the winner also gets destroyed
                    const winningTileIx = state.boards[
                      boardIndex
                    ].tiles.findIndex((t) => t.id === winner.id);
                    boardState.tiles.splice(winningTileIx, 1);
                    // }
                    // add mana to pool in the form of value * value, instead of merging's value + value
                    boardState.mana += winner.value * loser.value;
                  }

                  // update the score
                  boardState.score += tileHere.value;
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
          // record a move! moved this to the slideEffect in effects.ts
          // boardState.numberOfSlides++;

          commitSlideInternal(state);

          // for each enemy, check if their abilities should activate
          // const enemies = Object.values(state.entities).filter(isEnemy);
          // enemies.forEach((enemy) => {
          //   enemy.abilities.forEach((ability) => {
          //     if (boardState.numberOfSlides % ability.slidesToActivate === 0) {
          //       state = ability.stateUpdater(state);
          //       console.log("activated enemy ability", ability);
          //     }
          //   });
          // });

          // add a random tile if any are left.
          if (boardState.usableDeck.length > 0) {
            // FIXME: this doesn't show a next tile with 0 tiles left... need to work out the timing.
            // muffins
          } else {
            // we have no tiles in the bag/deck; let's try re-shuffling the tiles back into the bag!
            boardState.usableDeck = shuffleArray(state.player.baseTileBag);
            // TODO; maybe add a slide penalty in here for re-shuffling the bag? a la Peglin apparently
          }

          const newPickedOption = boardState.usableDeck[0];

          // console.log("picked tile has fromLine: ", newPickedOption.fromLine);
          boardState.tiles.push(
            // addRandomTile(
            //   boardState.tiles,
            //   boardState.boardWidth,
            //   boardState.boardHeight,
            //   [
            //     // ...boardState.baseTilesToSpawn,
            //     ...boardState.newTilesToSpawn,
            //   ],
            // ),
            {
              id: uniqueId(),
              name: newPickedOption.name.toString(),
              value: newPickedOption.value || 2,
              position: chooseEmptyTilePosition(
                boardState.boardWidth,
                boardState.boardHeight,
                boardState.tiles,
              ).position,
              fromLine: newPickedOption.fromLine,
              type: boardState.usableDeck[0].type,
              upgrades: newPickedOption.upgrades || [],
            },
          );
          // remove that tile from the usableDeck
          boardState.usableDeck.splice(0, 1);

          // check which parts of the required spell are complete, and mark that in the spell
          // FIXME: do this for each of the player state's chosenSpells.
          // const activeSpell =
          //   boardState.availableSpells[boardState.activeSpell];
          // const newCompletedArray: boolean[] = Array.from(
          //   {
          //     length: activeSpell.complete.length,
          //   },
          //   () => false,
          // );
          // for (let i = 0; i < boardState.tiles.length; i++) {
          //   const tile = boardState.tiles[i];
          //   activeSpell.spell.requiredTiles.forEach((rt, rtIx) => {
          //     if (!newCompletedArray[rtIx]) {
          //       if (rt.tileValue === tile.value && rt.tileName === tile.name) {
          //         newCompletedArray[rtIx] = true;
          //       }
          //     }
          //   });
          // }
          // activeSpell.complete = newCompletedArray;
        }

        // check for which tiles are in position to be elementally annihilated.
        // TODO: re-enable this once we figure out annihilations for slide-only
        // state.boards[boardIndex].imminentAnnihilations = detectAnnihilations(
        //   state.boards[boardIndex].tiles,
        // );
        // console.log(state.boards[boardIndex].imminentAnnihilations);
      }),

    addEffect: (target, name, data, opts) => {
      let outId!: EffectId; // will be set inside the producer
      set((state) => {
        outId = addEffectInternal(state, target, name, data, opts); // mutate draft only
      });
      return outId; // return from the action (not from set)
    },

    removeEffect: (id) =>
      set((state) => {
        removeEffectInternal(state, id);
      }),

    toggleTargeting: () =>
      set((state) => {
        state.targeting = !state.targeting;
      }),

    resetGame: () => {
      set((state) => {
        state.boards = [];
        state.choosing_old = false;
        state.choosingSpells = true;
        state.player = {
          maxHealth: 50,
          currentHealth: 50,
          knownSpells: spells,
          chosenSpells: [],
          baseTileBag: [], // will be filled in after choosing spells
          kind: "player",
          id: "PLAYER",
          name: "Sir Bearington",
          gold: 0,
        };
        state.waves = [
          [createEnemy(GolbinEnemy, 0, "a"), createEnemy(GolbinEnemy, 1, "z")],
          [
            createEnemy(ShielderEnemy, 0, ""),
            createEnemy(GolbinEnemy, 1, "a"),
            createEnemy(GolbinEnemy, 2, "z"),
          ],
        ];
        state.activeWave = 0;

        state.effects = {};
        state.effectsByTarget = {};
        // TODO: initiate enemy ability cooldowns here
        state.enemyAbilityCD = {};
        state.entities = {
          [state.player.id]: state.player,
          ...state.waves[state.activeWave].reduce(
            (acc, en) => {
              acc[en.id] = {
                id: en.id,
                kind: "enemy",
                name: en.name,
                maxHealth: en.maxHealth,
                currentHealth: en.currentHealth,
                abilities: en.abilities,
                passiveAbilities: en.passiveAbilities,
                loot: en.loot,
                position: en.position,
              } as Enemy;
              return acc;
            },
            {} as Record<EntityId, Enemy>,
          ),
        };
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

const INITIAL_TARGET = 500;

const initBoard = (
  width: number,
  height: number,
  // tilesToStart: Option[],
  // baseTilesToSpawn: Option[],
  // newSpell: { spell: Spell; complete: boolean[] },
  deckOfTiles: Option[],
) => {
  const newBoardState: BoardState = {
    score: 0,
    mana: 0,
    lines: 99,
    targetScore: INITIAL_TARGET,
    spellsCompleted: 0,
    boardWidth: width,
    boardHeight: height,
    tiles: [],
    basePoints: 0,
    multiplier: 0,
    // baseTilesToSpawn: tilesToStart,
    // newTilesToSpawn: newSpell.spell.spawns,
    // availableSpells: [],
    numberOfSlides: 0,
    // activeSpell: 0,
    draggedCells: [],
    usedUpgrades: [],
    ownedItems: [],
    selectedTiles: [],
    selectedDeckTiles: [],
    usableDeck: deckOfTiles,
    temporaryDeck: [],
    upgradedDeck: [],
    lockedTileNames: [],
    imminentAnnihilations: [],
  };
  /// INFINITE TILE STUFF STARTS HERE
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
  /// INFINITE TILE STUFF ENDS HERE

  /// DECK STUFF STARTS HERE
  const startingSpots = [0, 1].reduce(
    (chosenCells) => {
      return [
        ...chosenCells,
        chooseEmptyTilePosition(width, height, chosenCells),
      ];
    },
    [] as { position: Coordinate }[],
  );

  const shuffledDeck = shuffleArray(deckOfTiles);

  // const { deck, chosenTiles } = chooseTilesFromBag(deckOfTiles, 2);
  // take the given deck, shuffle it, and draw from that without ever reshuffling.

  newBoardState.tiles = startingSpots.map((ss, ssIx) => ({
    id: uniqueId(),
    name: shuffledDeck[ssIx].name.toString(),
    value: shuffledDeck[ssIx].value || 2,
    position: ss.position,
    fromLine: false,
    type: shuffledDeck[ssIx].type,
    upgrades: [],
  }));

  shuffledDeck.splice(0, 2);
  newBoardState.usableDeck = shuffledDeck;
  /// DECK STUFF ENDS HERE

  // newBoardState.availableSpells.push(newSpell);
  return newBoardState;
};

export type AnnihilationPair = { winner: Tile; loser: Tile };
// const elementsCollide = (t1: Tile, t2: Tile): AnnihilationPair | boolean => {
//   // Takes in two elemental tiles and returns the winner
//   // Returns false if it's not a destructive combo.
//   // for now, can only annihilate within range 1.
//   // return false;
//   if (
//     Math.abs(t1.position.x - t2.position.x) === 1 ||
//     Math.abs(t1.position.y - t2.position.y) === 1
//   ) {
//     const winningMap = {
//       F: "W",
//       A: "E",
//       E: "A",
//       W: "F",
//     };
//     // @ts-expect-error don't know how to fix
//     if (winningMap[t1.name] === t2.name) {
//       return { winner: t1, loser: t2 };
//       // @ts-expect-error don't know how to fix
//     } else if (winningMap[t2.name] === t1.name) {
//       return { winner: t2, loser: t1 };
//     }
//   }
//   return false;
// };

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
