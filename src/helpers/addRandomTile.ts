import { uniqueId } from "./uniqueId.ts";
import chooseWeightedOption, { Option } from "./chooseWeightedOption.ts";
import { Tile } from "../state";

export const addRandomTile = (
  tiles: Tile[],
  width: number,
  height: number,
  tileOptions: Option[],
): Tile => {
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

  const chosenTile = chooseWeightedOption(tileOptions);

  return {
    id: uniqueId(),
    name: chosenTile.id.toString(),
    value: chosenTile.value || 2,
    position: potentialNewCellPos,
    type: chosenTile.type,
    upgrades: [],
  };
};
