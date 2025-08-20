import { WritableDraft } from "immer";
import { Actions, GameState } from "../state";

export type Buff = {
  name: string;
  description: string;
  duration: number;
  quantity: number;
  stateUpdater: (
    state: WritableDraft<GameState & Actions>,
  ) => WritableDraft<GameState & Actions>;
};

export const BlockBuff = {
  name: "Block",
  description: "Reduces incoming damage and is consumed",
  duration: 1, // lasts one turn?
  quantity: 1, // will get overriden on application probably
};
