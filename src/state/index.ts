import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

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
  value: number;
  id: string;
};

type GameState = {
  // tiles: { [key: string]: Tile };
  tiles: Tile[];
  boardWidth: number;
  boardHeight: number;
};

type Actions = {
  // moveTile: (tile: Tile, newCoordinate: Coordinate) => void;
  move: (direction: Direction) => void;
};

export const useGameStore = create<GameState & Actions>()(
  immer((set) => ({
    // tiles: {
    //   'abc': {
    //     position: {x: 0, y: 0},
    //     id: 'abc',
    //     value: 2,
    //   }
    // },
    tiles: [
      {
        position: { x: 0, y: 0 },
        id: "abc",
        value: 2,
      },
    ],
    boardHeight: 4,
    boardWidth: 4,

    // moveTile: (tile: Tile, newCoordinate: Coordinate) => set(state => {
    //   state.tiles[tile.id].position = newCoordinate;
    // }),

    move: (direction: Direction) =>
      set((state) => {
        state.tiles.forEach((tile) => {
          tile.position.x += directionMap[direction].x;
          tile.position.y += directionMap[direction].y;
        });
      }),
  })),
);
