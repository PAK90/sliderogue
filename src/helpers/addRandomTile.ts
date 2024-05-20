import { uniqueId } from "./uniqueId.ts";
import chooseWeightedOption from "./chooseWeightedOption.ts";
import { Tile } from "../state";

export const addRandomTile = (tiles: Tile[], width: number, height: number) => {
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

  const tileOptions = [
    { id: 2, weight: 80 },
    { id: 4, weight: 10 },
    { id: "$", weight: 5 },
  ];

  return {
    id: uniqueId(),
    value: chooseWeightedOption(tileOptions),
    position: potentialNewCellPos,
  };
};
