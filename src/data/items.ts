import { WritableDraft } from "immer";
import { Actions, GameState } from "../state";

export type Item = {
  name: string;
  description: string;
  cost: number;
  type: "ITEM";
  stateUpdater: (
    state: WritableDraft<GameState & Actions>,
  ) => WritableDraft<GameState & Actions>;
};

const eightBallItem: Item = {
  name: "8 Ball",
  description: "Whenever an 8 tile merges, add 8 to the base points.",
  cost: 8,
  type: "ITEM",
  stateUpdater: (state: WritableDraft<GameState & Actions>) => {
    // state.boards[0].boardWidth++;
    return state;
  },
};

export const items: Item[] = [eightBallItem];
