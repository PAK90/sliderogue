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
  score: number;
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
      {
        position: { x: 2, y: 1 },
        id: "eee",
        value: 2,
      },
    ],
    boardHeight: 4,
    boardWidth: 4,
    score: 0,

    // moveTile: (tile: Tile, newCoordinate: Coordinate) => set(state => {
    //   state.tiles[tile.id].position = newCoordinate;
    // }),

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
                tileHere.value = nextPotentialTile.value + tileHere.value;

                // update the score
                state.score += tileHere.value;
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
  })),
);

const addRandomTile = (tiles: Tile[], width: number, height: number) => {
  // FIXME; this is awful
  let potentialNewCellPos = {
    x: Math.floor(Math.random() * width),
    y: Math.floor(Math.random() * height),
  };

  while (
    tiles.find(
      (t) =>
        t.position.x === potentialNewCellPos.x &&
        t.position.y === potentialNewCellPos.y,
    )
  ) {
    potentialNewCellPos = {
      x: Math.floor(Math.random() * width),
      y: Math.floor(Math.random() * height),
    };
  }

  return {
    id: `${Math.random()}-id`,
    value: Math.random() > 0.9 ? 4 : 2,
    position: potentialNewCellPos,
  };
};

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
