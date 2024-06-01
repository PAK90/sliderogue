import { Option } from "./chooseWeightedOption.ts";

export const chooseTilesFromBag = (bag: Option[], numberToChoose: number) => {
  const deck = bag;
  const chosenTiles = [];
  // specifically want to return the bag/deck afterwards so that we don't need to search the existing
  // bag/deck for the new tiles and slice them out or whatever; just do that here.
  return { deck, chosenTiles };
};
