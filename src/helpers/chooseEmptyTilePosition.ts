import { Coordinate } from "../state";
import range from "./range.ts";

type WithPosition<T = object> = T & {
  position: {
    x: number;
    y: number;
  };
};

export const chooseEmptyTilePosition = (
  width: number,
  height: number,
  existingTiles: WithPosition[],
): { position: Coordinate } => {
  // generate a list of all possible positions
  // we have this weird object shape here to support taking in Tile types which have this pattern.
  const allPos: { position: Coordinate }[] = [];
  range(width).forEach((_, rIx) => {
    range(height).forEach((_, cIx) => {
      if (
        !existingTiles.length ||
        !existingTiles.find((t) => t.position.x === rIx && t.position.y === cIx)
      ) {
        allPos.push({ position: { x: rIx, y: cIx } });
      }
    });
  });

  return allPos[Math.floor(Math.random() * allPos.length)];
};
